package com.therecommerce.workmap.notification.dto;

import com.therecommerce.workmap.notification.domain.NotificationPreference;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * 알림 수신 설정 DTO (WMP-NOTI-003, CR-028). 종류 × 채널(인앱/이메일/푸시) on/off.
 */
public final class NotificationPreferenceDtos {

    private NotificationPreferenceDtos() {}

    /** 단일 종류 설정. 미설정 종류는 서비스가 기본값(인앱 ON·외부 OFF)으로 채워 응답. */
    public record Item(
            String type,
            boolean inApp,
            boolean email,
            boolean push
    ) {
        public static Item from(NotificationPreference p) {
            return new Item(p.getType(), p.isInApp(), p.isEmail(), p.isPush());
        }
    }

    /** 조회 응답 — 전체 종류 × 현재 설정(기본값 머지). */
    public record ListResponse(List<Item> items) {}

    /** 갱신 요청 — 보낸 종류만 부분 upsert. */
    public record UpdateRequest(
            @NotEmpty(message = "설정 항목은 비어 있을 수 없습니다.")
            List<@NotNull ItemUpdate> items
    ) {}

    public record ItemUpdate(
            @NotNull(message = "알림 종류는 필수입니다.")
            String type,
            boolean inApp,
            boolean email,
            boolean push
    ) {}
}
