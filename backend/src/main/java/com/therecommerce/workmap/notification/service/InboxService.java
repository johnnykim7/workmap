package com.therecommerce.workmap.notification.service;

import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.workmap.notification.dto.InboxDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 받은함(WMP-NOTI-001, /inbox). 배정·멘션·마감·막힘은 이미 notifications.type 으로
 * 통합 수신되므로, 별도 소스 합산 없이 NotificationService 의 목록·안읽음 집계를 재사용해
 * 목록 + 안읽음 배지를 한 번에 반환한다(CR-011). 본인 알림만.
 */
@Service
@RequiredArgsConstructor
public class InboxService {

    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public InboxDtos.Response inbox(Long recipientId, Boolean isRead, PageRequest page) {
        return new InboxDtos.Response(
                notificationService.list(recipientId, isRead, page),
                notificationService.unreadCount(recipientId));
    }
}
