package com.therecommerce.workmap.invitation.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.invitation.config.AuthOtpProperties;
import com.therecommerce.workmap.invitation.domain.EmailOtp;
import com.therecommerce.workmap.invitation.domain.OtpPurpose;
import com.therecommerce.workmap.invitation.mapper.EmailOtpMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 이메일 인증번호(OTP) 발급·검증 (POL-013, CR-027).
 * - 발급: 6자리 난수 생성 → 이전 미소비 무효화 → 해시 저장 → bp-notification 발송(best-effort).
 * - 검증: 미소비·미만료·시도횟수 미초과 최신 인증번호와 매칭. 성공 시 소비(1회용).
 * 인증번호 평문은 응답·로그에 남기지 않는다(해시만 저장).
 */
@Service
@RequiredArgsConstructor
public class OtpService {

    private final EmailOtpMapper otpMapper;
    private final PasswordEncoder passwordEncoder;
    private final NotificationClient notificationClient;
    private final AuthOtpProperties props;
    private final SecureRandom random = new SecureRandom();

    /**
     * 인증번호 발급 + 이메일 발송. 재발송 쿨다운(POL-013) 초과 시 거부.
     * @param name 템플릿 {{name}} 변수(INVITE에서 사용, 없으면 빈 문자열)
     */
    @Transactional
    public void issue(String email, OtpPurpose purpose, Long userId, String name) {
        enforceResendCooldown(email, purpose);

        // 이전 미소비 인증번호 전부 무효화(같은 이메일·용도 1개만 유효)
        otpMapper.consumeAllActive(email, purpose.name());

        String code = generateCode();
        EmailOtp otp = EmailOtp.builder()
                .email(email)
                .purpose(purpose.name())
                .codeHash(passwordEncoder.encode(code))
                .userId(userId)
                .attemptCount(0)
                .expiresAt(OffsetDateTime.now().plusMinutes(props.getExpiresMinutes()))
                .build();
        otpMapper.insert(otp);

        Map<String, String> vars = new HashMap<>();
        vars.put("code", code);
        vars.put("expiresMin", String.valueOf(props.getExpiresMinutes()));
        vars.put("name", name != null ? name : "");
        notificationClient.sendEmail(email, purpose.templateCode(), vars);
    }

    /**
     * 인증번호 검증 + 소비(1회용). 실패 시 BusinessException.
     * - 인증번호 없음/만료/시도초과/불일치 분기.
     */
    @Transactional
    public void verifyAndConsume(String email, OtpPurpose purpose, String code) {
        EmailOtp otp = otpMapper.findLatestActive(email, purpose.name());
        if (otp == null) {
            // 미소비·미만료 인증번호 없음 — 만료/미발급/이미 소비 모두 여기로
            throw new BusinessException(WmpErrorCode.OTP_NOT_FOUND);
        }
        if (otp.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BusinessException(WmpErrorCode.OTP_EXPIRED);
        }
        if (otp.getAttemptCount() >= props.getMaxAttempts()) {
            otpMapper.markConsumed(otp.getId()); // 폐기(재발급 필요)
            throw new BusinessException(WmpErrorCode.OTP_ATTEMPTS_EXCEEDED);
        }
        if (!passwordEncoder.matches(code, otp.getCodeHash())) {
            otpMapper.incrementAttempt(otp.getId());
            // 증가 후 한도 도달이면 즉시 폐기(다음 시도 자체 차단)
            if (otp.getAttemptCount() + 1 >= props.getMaxAttempts()) {
                otpMapper.markConsumed(otp.getId());
            }
            throw new BusinessException(WmpErrorCode.OTP_MISMATCH);
        }
        otpMapper.markConsumed(otp.getId());
    }

    private void enforceResendCooldown(String email, OtpPurpose purpose) {
        EmailOtp latest = otpMapper.findLatestAny(email, purpose.name());
        if (latest != null && latest.getCreatedAt() != null) {
            OffsetDateTime allowedAt = latest.getCreatedAt().plusSeconds(props.getResendCooldownSeconds());
            if (allowedAt.isAfter(OffsetDateTime.now())) {
                throw new BusinessException(WmpErrorCode.OTP_RESEND_COOLDOWN);
            }
        }
    }

    private String generateCode() {
        return String.format("%06d", random.nextInt(1_000_000));
    }
}
