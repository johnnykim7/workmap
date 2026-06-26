package com.therecommerce.workmap.notification.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.notification.domain.Notification;
import com.therecommerce.workmap.notification.dto.NotificationDtos;
import com.therecommerce.workmap.notification.mapper.NotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 알림 수신 조회/읽음 처리(WMP-NOTI-001). 발행은 {@code NotificationEventListener}가 담당하며
 * 여기서는 본인(recipient) 알림의 조회와 읽음 처리만 다룬다.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationMapper notificationMapper;

    /** 본인 알림 목록(읽음 필터 선택). 최신순 페이징. */
    @Transactional(readOnly = true)
    public PageResponse<NotificationDtos.Response> list(Long recipientId, Boolean isRead, PageRequest page) {
        List<Notification> rows = notificationMapper.findByRecipient(
                recipientId, isRead, page.getPageSize(), page.getOffset());
        long total = notificationMapper.countByRecipient(recipientId, isRead);
        List<NotificationDtos.Response> items = rows.stream()
                .map(NotificationDtos.Response::from)
                .toList();
        return PageResponse.of(items, total, page);
    }

    /** 안 읽은 알림 개수(받은함 배지). */
    @Transactional(readOnly = true)
    public long unreadCount(Long recipientId) {
        return notificationMapper.countUnread(recipientId);
    }

    /** 읽음 처리. 본인 알림이 아니면 거부(WMP-7761). */
    @Transactional
    public void markRead(Long id, Long recipientId) {
        Notification n = notificationMapper.findById(id);
        if (n == null) {
            throw new BusinessException(WmpErrorCode.NOTIFICATION_NOT_FOUND);
        }
        if (!n.getRecipientId().equals(recipientId)) {
            throw new BusinessException(WmpErrorCode.NOTIFICATION_FORBIDDEN);
        }
        notificationMapper.markRead(id, recipientId);
    }
}
