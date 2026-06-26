package com.therecommerce.workmap.burndown.listener;

import com.therecommerce.workmap.burndown.service.BurndownService;
import com.therecommerce.workmap.common.event.SprintEvents;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 번다운 스냅샷 생성자(T1-6, CR-012). 스프린트 시작/완료 이벤트를 본 트랜잭션 커밋 후(AFTER_COMMIT)
 * 비동기로 소비해 스냅샷을 적재한다(@Async + REQUIRES_NEW — 스냅샷 실패가 원 작업으로 전파되지 않음).
 *
 * <p>인터페이스 바인딩 원칙(T1-6): SprintService는 이 리스너를 모른다 — 계약(이벤트+페이로드)만 보고 처리.
 * 일별 DAILY 스냅샷은 {@code BurndownScheduler}가 담당.
 */
@Component
@RequiredArgsConstructor
public class BurndownEventListener {

    private final BurndownService burndownService;

    /** SprintStarted → START 기준선 스냅샷(시작일 기준). */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onSprintStarted(SprintEvents.SprintStarted event) {
        burndownService.snapshotStart(event.sprintId(), event.startDate());
    }

    /** SprintCompleted → COMPLETE 최종 스냅샷(완료일 기준 — 벨로시티 소스). */
    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onSprintCompleted(SprintEvents.SprintCompleted event) {
        burndownService.snapshotComplete(event.sprintId(), event.completedAt().toLocalDate());
    }
}
