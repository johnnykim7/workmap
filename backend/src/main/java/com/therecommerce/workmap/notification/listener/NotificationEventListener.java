package com.therecommerce.workmap.notification.listener;

import com.therecommerce.workmap.common.event.WorkItemEvents;
import com.therecommerce.workmap.notification.domain.Notification;
import com.therecommerce.workmap.notification.mapper.NotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 알림 발행자(T1-6). 알림 유발 이벤트를 본 트랜잭션 커밋 후(AFTER_COMMIT) 비동기로 소비한다.
 * 알림 실패가 원 작업(생성/배정/전이) 실패로 전파되지 않도록 분리(@Async + REQUIRES_NEW).
 *
 * <p>인터페이스 바인딩 원칙: WorkItemService는 이 리스너를 모른다 — 계약(이벤트+페이로드)만 보고 처리.
 */
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationMapper notificationMapper;

    /** WorkItemAssigned → 신규 담당자에게 배정 알림. */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAssigned(WorkItemEvents.WorkItemAssigned event) {
        if (event.assigneeId() == null) {
            return;  // 미배정(BIZ-002) — 알림 없음
        }
        save(event.assigneeId(), "ASSIGNED", event.workItemId(), "업무가 배정되었습니다.");
    }

    /** WorkItemBlocked → 담당자 + 멘션 대상에게 막힘 알림. */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBlocked(WorkItemEvents.WorkItemBlocked event) {
        if (event.assigneeId() != null) {
            save(event.assigneeId(), "BLOCKED", event.workItemId(),
                    "업무가 막혔습니다: " + event.blockReason());
        }
        if (event.mentionedUserIds() != null) {
            event.mentionedUserIds().forEach(uid ->
                    save(uid, "BLOCKED", event.workItemId(), "막힌 업무에 언급되었습니다."));
        }
    }

    /** WorkItemMentioned → 멘션 대상에게 알림. */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMentioned(WorkItemEvents.WorkItemMentioned event) {
        if (event.mentionedUserIds() == null) {
            return;
        }
        event.mentionedUserIds().forEach(uid ->
                save(uid, "MENTIONED", event.workItemId(), "댓글에서 언급되었습니다."));
    }

    private void save(Long recipientId, String type, Long workItemId, String message) {
        notificationMapper.insert(Notification.builder()
                .recipientId(recipientId)
                .type(type)
                .workItemId(workItemId)
                .message(message)
                .isRead(false)
                .build());
    }
}
