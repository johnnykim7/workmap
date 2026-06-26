package com.therecommerce.workmap.notification.dto;

import com.therecommerce.workmap.notification.domain.Notification;

import java.time.OffsetDateTime;

/**
 * 알림 조회 DTO (WMP-NOTI-001). 발행은 리스너(NotificationEventListener)가, 수신 조회는 여기서.
 */
public final class NotificationDtos {

    private NotificationDtos() {}

    public record Response(
            Long id,
            String type,
            Long workItemId,
            String message,
            boolean isRead,
            OffsetDateTime createdAt
    ) {
        public static Response from(Notification n) {
            return new Response(
                    n.getId(), n.getType(), n.getWorkItemId(),
                    n.getMessage(), n.isRead(), n.getCreatedAt());
        }
    }
}
