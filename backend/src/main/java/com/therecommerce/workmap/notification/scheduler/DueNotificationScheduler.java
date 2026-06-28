package com.therecommerce.workmap.notification.scheduler;

import com.therecommerce.workmap.notification.service.DueNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 마감 알림 배치 트리거(WMP-NOTI-005, CR-028). 매일 오전 한 번 마감 임박/초과 항목을 스캔한다.
 * 로직은 {@link DueNotificationService}(테스트 용이). @EnableScheduling은 AppConfig.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DueNotificationScheduler {

    private final DueNotificationService dueNotificationService;

    /** 매일 09:00(KST) — 업무 시작 시점에 마감 임박/초과 알림. */
    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
    public void scanDueItems() {
        try {
            dueNotificationService.notifyDueItems();
        } catch (Exception e) {
            log.error("마감 알림 배치 실패", e);
        }
    }
}
