package com.therecommerce.workmap.invitation.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 인증번호(OTP)·초대 정책 설정(POL-013, CR-027). application.yml {@code workmap.auth.otp.*}.
 * 빈 등록은 {@code @ConfigurationPropertiesScan}(WorkmapApplication)이 담당.
 */
@ConfigurationProperties(prefix = "workmap.auth.otp")
@Getter
@Setter
public class AuthOtpProperties {

    /** 인증번호 만료(분). 기본 10. */
    private int expiresMinutes = 10;

    /** 인증번호당 검증 시도 최대 횟수. 초과 시 폐기(재발급 필요). 기본 5. */
    private int maxAttempts = 5;

    /** 같은 이메일·용도 재발송 쿨다운(초). 기본 60. */
    private int resendCooldownSeconds = 60;

    /** 초대(invitation) 토큰 만료(시간). 기본 72. */
    private int invitationExpiresHours = 72;

    /** 비밀번호 재설정 토큰 만료(분). 분실은 짧게 — 기본 30(POL-013-A). */
    private int resetTokenExpiresMinutes = 30;
}
