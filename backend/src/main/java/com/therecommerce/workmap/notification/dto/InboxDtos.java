package com.therecommerce.workmap.notification.dto;

import com.therecommerce.common.paging.PageResponse;

/**
 * 받은함 응답 DTO (WMP-NOTI-001, /inbox).
 * "내게 온 것 통합"은 이미 notifications.type(배정·멘션·마감·막힘)으로 통합 수신되므로,
 * 받은함은 알림 목록 + 안읽음 배지(unreadCount)를 한 번에 제공하는 별칭이다(CR-011).
 */
public final class InboxDtos {

    private InboxDtos() {}

    public record Response(
            PageResponse<NotificationDtos.Response> notifications,
            long unreadCount
    ) {}
}
