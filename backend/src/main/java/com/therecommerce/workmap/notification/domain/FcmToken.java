package com.therecommerce.workmap.notification.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * fcm_tokens 도메인(T3-1, WMP-NOTI-004, CR-028).
 * 푸시 전달용 FCM 기기 토큰. 로그인 시 등록·로그아웃 시 삭제, 한 사용자 다기기 허용.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FcmToken {

    private Long id;
    private Long userId;
    private String fcmToken;
    private String deviceInfo;
    private OffsetDateTime createdAt;
}
