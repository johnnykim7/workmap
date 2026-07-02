package com.therecommerce.workmap.invitation.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.invitation.domain.SignupRequest;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.InviteRequest;
import com.therecommerce.workmap.invitation.dto.SignupDtos.ApproveRequest;
import com.therecommerce.workmap.invitation.dto.SignupDtos.SignupRequestBody;
import com.therecommerce.workmap.invitation.dto.SignupDtos.SignupRequestResponse;
import com.therecommerce.workmap.invitation.mapper.SignupRequestMapper;
import com.therecommerce.workmap.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 가입 요청 (WMP-AUTH-010, CR-032).
 * - 신청: signup_requests(PENDING) 생성. user·초대 미생성.
 * - 승인: 역할 지정 → InvitationService.invite 위임(초대 토큰 발송) → APPROVED.
 * - 거절: REJECTED(사유 선택).
 */
@Service
@RequiredArgsConstructor
public class SignupRequestService {

    private final SignupRequestMapper signupMapper;
    private final UserMapper userMapper;
    private final InvitationService invitationService;

    /** 셀프 신청(공개). 이미 가입/대기 중이면 거부. */
    @Transactional
    public void request(SignupRequestBody body) {
        if (userMapper.existsByEmail(body.email())) {
            throw new BusinessException(WmpErrorCode.EMAIL_DUPLICATED);
        }
        if (signupMapper.findPendingByEmail(body.email()) != null) {
            throw new BusinessException(WmpErrorCode.SIGNUP_REQUEST_PENDING_DUPLICATED);
        }
        signupMapper.insert(SignupRequest.builder()
                .email(body.email())
                .name(body.name())
                .reason(body.reason())
                .status("PENDING")
                .build());
    }

    @Transactional(readOnly = true)
    public List<SignupRequestResponse> list(String status) {
        return signupMapper.findByStatus(status).stream()
                .map(SignupRequestResponse::from)
                .toList();
    }

    /** 승인 — 역할 지정 후 초대 발송(기존 초대 플로우 재사용). */
    @Transactional
    public void approve(Long id, ApproveRequest req, Long adminId) {
        SignupRequest sr = getPending(id);
        // 초대 발송(이미 가입/PENDING 초대면 InvitationService가 거부).
        invitationService.invite(
                new InviteRequest(sr.getEmail(), sr.getName(), req.roleOrDefault(), null), adminId);
        signupMapper.markProcessed(id, "APPROVED", adminId, null);
    }

    /** 거절 — 사유 선택. */
    @Transactional
    public void reject(Long id, String reason, Long adminId) {
        getPending(id);
        signupMapper.markProcessed(id, "REJECTED", adminId, reason);
    }

    private SignupRequest getPending(Long id) {
        SignupRequest sr = signupMapper.findById(id);
        if (sr == null) {
            throw new BusinessException(WmpErrorCode.SIGNUP_REQUEST_NOT_FOUND);
        }
        if (!"PENDING".equals(sr.getStatus())) {
            throw new BusinessException(WmpErrorCode.SIGNUP_REQUEST_ALREADY_PROCESSED);
        }
        return sr;
    }
}
