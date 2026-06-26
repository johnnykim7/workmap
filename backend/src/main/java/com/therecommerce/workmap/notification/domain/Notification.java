package com.therecommerce.workmap.notification.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * notifications 도메인(T3-1, WMP-NOTI-001). 도메인 이벤트(AFTER_COMMIT) 소비 시 생성된다.
 * type: ASSIGNED/MENTIONED/OVERDUE/BLOCKED/DUE_APPROACHING.
 */
@Getter
@Setter
@Builder
public class Notification {

    private Long id;
    private Long recipientId;
    private String type;
    private Long workItemId;
    private String message;
    private boolean isRead;
    private OffsetDateTime createdAt;
}
