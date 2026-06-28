package com.therecommerce.workmap.notification.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * FCM 기기 토큰 DTO (WMP-NOTI-004, CR-028). userId는 인증 토큰에서 주입(요청 바디에 없음).
 */
public final class FcmTokenDtos {

    private FcmTokenDtos() {}

    /** 등록 — 로그인 시. */
    public record RegisterRequest(
            @NotBlank(message = "FCM 토큰은 필수입니다.")
            String fcmToken,
            String deviceInfo
    ) {}

    /** 삭제 — 로그아웃 시. */
    public record DeleteRequest(
            @NotBlank(message = "FCM 토큰은 필수입니다.")
            String fcmToken
    ) {}
}
