package com.therecommerce.workmap.invitation.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.invitation.config.AuthOtpProperties;
import com.therecommerce.workmap.invitation.domain.OtpPurpose;
import com.therecommerce.workmap.invitation.domain.PasswordResetToken;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.ChangeRequest;
import com.therecommerce.workmap.invitation.dto.InvitationDtos.ResetRequest;
import com.therecommerce.workmap.invitation.mapper.PasswordResetTokenMapper;
import com.therecommerce.workmap.user.domain.User;
import com.therecommerce.workmap.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * 비밀번호 분실 재설정·변경 (WMP-AUTH-007/008, CR-027 토큰 보정).
 * - forgot/reset: 로그인 못 하는 사용자가 **재설정 링크 토큰**으로 새 비밀번호 설정. 계정 열거 방지.
 * - change: 로그인 사용자가 현재 PW + **인증번호(OTP)** 2차 인증으로 변경(메일 링크 맥락 없음 → OTP 유지).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordService {

    private static final String RESET_TEMPLATE = "WMP_RESET_LINK";

    private final UserMapper userMapper;
    private final PasswordResetTokenMapper resetTokenMapper;
    private final TokenService tokenService;
    private final OtpService otpService;
    private final NotificationClient notificationClient;
    private final PasswordEncoder passwordEncoder;
    private final AuthOtpProperties props;

    /**
     * 분실 재설정 1단계 — 재설정 링크 발송. **계정 열거 방지**: 미존재/비활성 이메일도 예외 없이 종료(발송만 스킵).
     */
    @Transactional
    public void requestForgot(String email) {
        User user = userMapper.findByEmail(email);
        if (user == null || !user.isActive()) {
            log.info("[password] forgot 요청 — 미존재/비활성 이메일(발송 스킵). email={}", email);
            return;
        }
        // 이전 미소비 토큰 무효화 + 새 토큰 발급(30분).
        resetTokenMapper.consumeAllByUser(user.getId());
        String rawToken = tokenService.generateRawToken();
        resetTokenMapper.insert(PasswordResetToken.builder()
                .userId(user.getId())
                .tokenHash(tokenService.hash(rawToken))
                .expiresAt(OffsetDateTime.now().plusMinutes(props.getResetTokenExpiresMinutes()))
                .build());

        String url = notificationClient.webBaseUrl() + "/password/reset?token=" + rawToken;
        notificationClient.sendEmail(email, RESET_TEMPLATE, Map.of(
                "name", user.getName() != null ? user.getName() : "",
                "actionUrl", url,
                "expiresMin", String.valueOf(props.getResetTokenExpiresMinutes())));
    }

    /**
     * 분실 재설정 2단계 — 토큰 검증 후 새 비밀번호 설정.
     */
    @Transactional
    public void reset(ResetRequest req) {
        PasswordResetToken token = resetTokenMapper.findActiveByTokenHash(tokenService.hash(req.token()));
        if (token == null) {
            throw new BusinessException(WmpErrorCode.RESET_TOKEN_INVALID);
        }
        User user = userMapper.findById(token.getUserId());
        if (user == null || !user.isActive()) {
            throw new BusinessException(WmpErrorCode.USER_NOT_FOUND);
        }
        userMapper.updatePassword(user.getId(), passwordEncoder.encode(req.password()));
        resetTokenMapper.markConsumed(token.getId()); // 1회용
    }

    /**
     * 변경 1단계 — 본인 이메일로 인증번호 발송(CHANGE만 OTP 유지).
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
