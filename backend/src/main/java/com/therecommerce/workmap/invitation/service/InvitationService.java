package com.therecommerce.workmap.invitation.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.auth.dto.LoginResponse;
import com.therecommerce.workmap.auth.service.AuthService;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.invitation.config.AuthOtpProperties;
import com.therecommerce.workmap.invitation.domain.Invitation;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.AcceptRequest;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.InvitationPreview;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.InvitationResponse;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.InviteRequest;
import com.therecommerce.workmap.invitation.mapper.InvitationMapper;
import com.therecommerce.workmap.user.domain.User;
import com.therecommerce.workmap.user.dto.CreateUserRequest;
import com.therecommerce.workmap.user.mapper.UserMapper;
import com.therecommerce.workmap.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * 사용자 초대 (WMP-AUTH-004/006, CR-027 토큰 보정).
 * - 초대: invitations(PENDING + 토큰 해시) 생성 → 수락 링크 이메일 발송. user는 만들지 않는다.
 * - 수락: 토큰 검증 → UserService.create 위임(user 생성, 이름·역할·부서 승계) → ACCEPTED·토큰 소비 → 자동 로그인.
 * 인증번호(OTP) 입력 제거 — 메일 링크 클릭이 본인 확인(메일함 접근).
 */
@Service
@RequiredArgsConstructor
public class InvitationService {

    private static final String INVITE_TEMPLATE = "WMP_INVITE_LINK";

    private final InvitationMapper invitationMapper;
    private final UserMapper userMapper;
    private final UserService userService;
    private final TokenService tokenService;
    private final NotificationClient notificationClient;
    private final AuthService authService;
    private final AuthOtpProperties props;

    @Transactional
    public InvitationResponse invite(InviteRequest req, Long invitedBy) {
        if (userMapper.existsByEmail(req.email())) {
            throw new BusinessException(WmpErrorCode.EMAIL_DUPLICATED);
        }
        if (invitationMapper.findPendingByEmail(req.email()) != null) {
            throw new BusinessException(WmpErrorCode.INVITATION_PENDING_DUPLICATED);
        }
        String rawToken = tokenService.generateRawToken();
        Invitation invitation = Invitation.builder()
                .email(req.email())
                .name(req.name())
                .role(req.roleOrDefault())
                .departmentId(req.departmentId())
                .status("PENDING")
                .tokenHash(tokenService.hash(rawToken))
                .invitedBy(invitedBy)
                .expiresAt(OffsetDateTime.now().plusHours(props.getInvitationExpiresHours()))
                .build();
        invitationMapper.insert(invitation);

        sendInviteEmail(req.email(), req.name(), rawToken);
        return InvitationResponse.from(invitation);
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> list(String status) {
        return invitationMapper.findByStatus(status).stream()
                .map(InvitationResponse::from)
                .toList();
    }

    @Transactional
    public void resend(Long invitationId) {
        Invitation invitation = getPending(invitationId);
        // 재발송 = 새 토큰 발급(이전 무효) + 만료 연장.
        String rawToken = tokenService.generateRawToken();
        invitationMapper.updateToken(invitation.getId(), tokenService.hash(rawToken),
                OffsetDateTime.now().plusHours(props.getInvitationExpiresHours()));
        sendInviteEmail(invitation.getEmail(), invitation.getName(), rawToken);
    }

    @Transactional
    public void revoke(Long invitationId) {
        Invitation invitation = invitationMapper.findById(invitationId);
        if (invitation == null) {
            throw new BusinessException(WmpErrorCode.INVITATION_NOT_FOUND);
        }
        if ("ACCEPTED".equals(invitation.getStatus())) {
            throw new BusinessException(WmpErrorCode.INVITATION_ALREADY_ACCEPTED);
        }
        invitationMapper.updateStatus(invitationId, "REVOKED");
    }

    /** 수락 화면 진입 — 토큰으로 초대 정보 미리보기(이메일·이름·역할). 무효/만료 시 거부. */
    @Transactional(readOnly = true)
    public InvitationPreview preview(String rawToken) {
        Invitation invitation = findValidByToken(rawToken);
        return new InvitationPreview(invitation.getEmail(), invitation.getName(),
                invitation.getRole(), invitation.getExpiresAt());
    }

    /**
     * 초대 수락 — 토큰 검증 → user 생성 → ACCEPTED·토큰 소비 → 자동 로그인 토큰.
     */
    @Transactional
    public LoginResponse accept(AcceptRequest req) {
        Invitation invitation = findValidByToken(req.token());

        // user 생성(이름·역할·부서는 초대값 승계). UserService가 이메일 중복·BCrypt 처리.
        userService.create(new CreateUserRequest(
                invitation.getEmail(), req.password(), invitation.getName(),
                invitation.getRole(), invitation.getDepartmentId()));

        invitationMapper.markAccepted(invitation.getId()); // 토큰은 ACCEPTED로 소비(재사용 불가)

        User user = userMapper.findByEmail(invitation.getEmail());
        return authService.issueTokensFor(user);
    }

    /** PENDING·미만료 초대를 토큰 해시로 조회. 무효/만료 시 INVITATION_TOKEN_INVALID. */
    private Invitation findValidByToken(String rawToken) {
        Invitation invitation = invitationMapper.findPendingByTokenHash(tokenService.hash(rawToken));
        if (invitation == null) {
            throw new BusinessException(WmpErrorCode.INVITATION_TOKEN_INVALID);
        }
        if (invitation.getExpiresAt().isBefore(OffsetDateTime.now())) {
            invitationMapper.updateStatus(invitation.getId(), "EXPIRED");
            throw new BusinessException(WmpErrorCode.INVITATION_TOKEN_INVALID);
        }
        return invitation;
    }

    private void sendInviteEmail(String email, String name, String rawToken) {
        String url = notificationClient.webBaseUrl() + "/invite/accept?token=" + rawToken;
        notificationClient.sendEmail(email, INVITE_TEMPLATE, Map.of(
                "name", name != null ? name : "",
                "actionUrl", url,
                "expiresHours", String.valueOf(props.getInvitationExpiresHours())));
    }

    private Invitation getPending(Long invitationId) {
        Invitation invitation = invitationMapper.findById(invitationId);
        if (invitation == null) {
            throw new BusinessException(WmpErrorCode.INVITATION_NOT_FOUND);
        }
        if ("ACCEPTED".equals(invitation.getStatus())) {
            throw new BusinessException(WmpErrorCode.INVITATION_ALREADY_ACCEPTED);
        }
        return invitation;
    }
}
