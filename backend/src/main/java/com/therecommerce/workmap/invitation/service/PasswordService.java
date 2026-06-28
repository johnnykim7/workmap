package com.therecommerce.workmap.invitation.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.invitation.domain.OtpPurpose;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.ChangeRequest;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.ResetRequest;
import com.therecommerce.workmap.user.domain.User;
import com.therecommerce.workmap.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 비밀번호 분실 재설정·변경 (WMP-AUTH-007/008, CR-027).
 * - forgot/reset: 로그인 못 하는 사용자가 이메일 인증번호로 재설정. 계정 열거 방지(미존재도 동일 응답).
 * - change: 로그인 사용자가 현재 PW + 인증번호 2차 인증으로 변경.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordService {

    private final UserMapper userMapper;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;

    /**
     * 분실 재설정 1단계 — 인증번호 발송. **계정 열거 방지**: 미존재/비활성 이메일도 예외 없이 종료(발송만 스킵).
     */
    @Transactional
    public void requestForgot(String email) {
        User user = userMapper.findByEmail(email);
        if (user == null || !user.isActive()) {
            // 응답은 성공과 구분되지 않게 — 인증번호만 발송하지 않는다.
            log.info("[password] forgot 요청 — 미존재/비활성 이메일(발송 스킵). email={}", email);
            return;
        }
        otpService.issue(email, OtpPurpose.RESET, user.getId(), user.getName());
    }

    /**
     * 분실 재설정 2단계 — 인증번호 검증 후 새 비밀번호 설정.
     * 미존재 이메일에 대해서는 인증번호 검증 단계에서 OTP_NOT_FOUND로 떨어진다(발송된 적 없으므로).
     */
    @Transactional
    public void reset(ResetRequest req) {
        otpService.verifyAndConsume(req.email(), OtpPurpose.RESET, req.code());
        User user = userMapper.findByEmail(req.email());
        if (user == null) {
            // 인증번호는 통과했으나 user 없음 — 정상 흐름에선 발생 안 함(방어).
            throw new BusinessException(WmpErrorCode.USER_NOT_FOUND);
        }
        userMapper.updatePassword(user.getId(), passwordEncoder.encode(req.password()));
    }

    /**
     * 변경 1단계 — 본인 이메일로 인증번호 발송.
     */
    @Transactional
    public void requestChangeOtp(Long userId) {
        User user = findActiveUser(userId);
        otpService.issue(user.getEmail(), OtpPurpose.CHANGE, user.getId(), user.getName());
    }

    /**
     * 변경 2단계 — 현재 PW + 인증번호 2차 인증 후 새 비밀번호 설정.
     */
    @Transactional
    public void change(Long userId, ChangeRequest req) {
        User user = findActiveUser(userId);
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new BusinessException(WmpErrorCode.INVALID_CREDENTIALS);
        }
        if (passwordEncoder.matches(req.newPassword(), user.getPasswordHash())) {
            throw new BusinessException(WmpErrorCode.PASSWORD_SAME_AS_CURRENT);
        }
        otpService.verifyAndConsume(user.getEmail(), OtpPurpose.CHANGE, req.code());
        userMapper.updatePassword(user.getId(), passwordEncoder.encode(req.newPassword()));
    }

    private User findActiveUser(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null || !user.isActive()) {
            throw new BusinessException(WmpErrorCode.USER_NOT_FOUND);
        }
        return user;
    }
}
