package com.therecommerce.workmap.notification.service;

import com.therecommerce.workmap.notification.domain.NotificationType;
import com.therecommerce.workmap.notification.mapper.NotificationMapper;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * 마감 알림 발행 서비스(WMP-NOTI-005, CR-028). 미완료·담당자有 항목의 due_date를 스캔하여
 * 마감 임박(daysLeft ∈ [0, dueSoonDays])·마감 초과(daysLeft &lt; 0)를 담당자에게 알린다.
 *
 * <p>중복 방지: 같은 수신자·업무·타입의 알림이 오늘 이미 있으면 건너뛴다(하루 1회).
 * Clock 주입(테스트 날짜 Mock). 발행은 {@link NotificationDispatcher} 경유(인앱+설정 fan-out).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DueNotificationService {

    private final WorkItemMapper workItemMapper;
    private final NotificationMapper notificationMapper;
    private final NotificationDispatcher dispatcher;
    private final Clock clock;

    /** 마감 임박 기준 일수(POL-009, notify.due-soon-days). 기본 1일. */
    @Value("${notify.due-soon-days:1}")
    private int dueSoonDays;

    /** 마감 임박/초과 항목을 스캔하여 알림 발행. 한 항목 실패가 나머지를 막지 않도록 격리. */
    @Transactional
    public void notifyDueItems() {
        LocalDate today = LocalDate.now(clock);
        List<WorkItem> candidates = workItemMapper.findDueForNotification(dueSoonDays);
        int sent = 0;
        for (WorkItem item : candidates) {
            try {
                if (publishFor(item, today)) {
                    sent++;
                }
            } catch (Exception e) {
                log.warn("마감 알림 발행 실패 workItemId={}", item.getId(), e);
            }
        }
        log.info("마감 알림 스캔 완료: 후보 {}건, 발행 {}건 (date={})", candidates.size(), sent, today);
    }

    /** 한 항목에 대해 임박/초과 판정 후 발행. 발행하면 true. */
    private boolean publishFor(WorkItem item, LocalDate today) {
        Long assignee = item.getAssigneeId();
        if (assignee == null || item.getDueDate() == null) {
            return false;
        }
        long daysLeft = ChronoUnit.DAYS.between(today, item.getDueDate());

        NotificationType type;
        String message;
        if (daysLeft < 0) {
            type = NotificationType.OVERDUE;
            message = "업무 마감일이 지났습니다(" + (-daysLeft) + "일 초과).";
        } else if (daysLeft <= dueSoonDays) {
            type = NotificationType.DUE_APPROACHING;
            message = daysLeft == 0
                    ? "업무 마감일이 오늘입니다."
                    : "업무 마감이 " + daysLeft + "일 남았습니다.";
        } else {
            return false;  // 임박 범위 밖(쿼리 여유분) — 스킵
        }

        // 중복 방지: 오늘 같은 수신자·업무·타입 알림이 이미 있으면 스킵
        if (notificationMapper.existsTodayByType(assignee, item.getId(), type.name())) {
            return false;
        }
        dispatcher.dispatch(assignee, type, item.getId(), message);
        return true;
    }
}
