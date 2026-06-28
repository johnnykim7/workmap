package com.therecommerce.workmap.invitation.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.auth.dto.LoginResponse;
import com.therecommerce.workmap.auth.service.AuthService;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.invitation.config.AuthOtpProperties;
import com.therecommerce.workmap.invitation.domain.Invitation;
import com.therecommerce.workmap.invitation.domain.OtpPurpose;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.AcceptRequest;
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

/**
 * 사용자 초대 (WMP-AUTH-004/006, CR-027).
 * - 초대: invitations(PENDING) 생성 → INVITE 인증번호 발급·발송. user는 만들지 않는다.
 * - 수락: INVITE 인증번호 검증 → UserService.create 위임(user 생성, 이름·역할·부서 승계) → ACCEPTED.
 *   가입 직후 토큰을 발급해 자동 로그인.
 */
@Service
@RequiredArgsConstructor
public class InvitationService {

    private final InvitationMapper invitationMapper;
    private final UserMapper userMapper;
    private final UserService userService;
    private final OtpService otpService;
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
        Invitation invitation = Invitation.builder()
                .email(req.email())
                .name(req.name())
                .role(req.roleOrDefault())
                .departmentId(req.departmentId())
                .status("PENDING")
                .invitedBy(invitedBy)
                .expiresAt(OffsetDateTime.now().plusHours(props.getInvitationExpiresHours()))
                .build();
        invitationMapper.insert(invitation);

        otpService.issue(req.email(), OtpPurpose.INVITE, null, req.name());
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
        otpService.issue(invitation.getEmail(), OtpPurpose.INVITE, null, invitation.getName());
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

    /**
     * 초대 수락 — 인증번호 검증 → user 생성 → ACCEPTED → 자동 로그인 토큰.
     */
    @Transactional
    public LoginResponse accept(AcceptRequest req) {
        Invitation invitation = invitationMapper.findPendingByEmail(req.email());
        if (invitation == null) {
            throw new BusinessException(WmpErrorCode.INVITATION_NOT_FOUND);
        }
        if (invitation.getExpiresAt().isBefore(OffsetDateTime.now())) {
            invitationMapper.updateStatus(invitation.getId(), "EXPIRED");
            throw new BusinessException(WmpErrorCode.INVITATION_EXPIRED);
        }

        // 인증번호 검증(실패 시 예외로 롤백 — user 미생성)
        otpService.verifyAndConsume(req.email(), OtpPurpose.INVITE, req.code());

        // user 생성(이름·역할·부서는 초대값 승계). UserService가 이메일 중복·BCrypt 처리.
        userService.create(new CreateUserRequest(
                req.email(), req.password(), invitation.getName(),
                invitation.getRole(), invitation.getDepartmentId()));

        invitationMapper.markAccepted(invitation.getId());

        User user = userMapper.findByEmail(req.email());
        return authService.issueTokensFor(user);
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
