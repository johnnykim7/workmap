package com.therecommerce.workmap.notification.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * notification_preferences 도메인(T3-1, WMP-NOTI-003, CR-028).
 * 사용자별 알림 종류 × 채널(인앱/이메일/푸시) on/off. sparse 저장 — 행이 없으면 기본값 적용.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    private Long id;
    private Long userId;
    private String type;
    private boolean inApp;
    private boolean email;
    private boolean push;
    private OffsetDateTime updatedAt;
}
