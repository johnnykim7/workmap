package com.therecommerce.workmap.metrics.listener;

import com.therecommerce.workmap.common.event.SprintEvents;
import com.therecommerce.workmap.metrics.mapper.MetricsMapper;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

/**
 * Say-Do 커밋 동결자 (CR-043, WMP-HOME-008). 스프린트 시작(SprintStarted) 시점에
 * 그 스프린트 소속 항목의 개수·포인트를 "약속(commitment)"으로 동결한다(sprint_commitments).
 *
 * <p>이월로 sprint_id가 빠져도 동결본이 "약속"을 보존 → Say-Do(완료÷약속) 성립.
 * burndown 리스너와 동일 패턴(@Async + AFTER_COMMIT + REQUIRES_NEW — 실패 격리).
 * insert는 ON CONFLICT DO NOTHING(멱등) — 재시작 시 최초 동결 유지.
 */
@Component
@RequiredArgsConstructor
public class SayDoCommitmentListener {

    private final MetricsMapper metricsMapper;
    private final WorkItemMapper workItemMapper;

    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onSprintStarted(SprintEvents.SprintStarted event) {
        List<Long> committedIds = event.committedItems();
        if (committedIds == null) committedIds = List.of();

        // 시작 시점 소속 항목의 포인트 합(null → 0).
        List<WorkItem> items = workItemMapper.findBySprint(event.sprintId());
        int points = items.stream()
                .mapToInt(w -> w.getStoryPoints() == null ? 0 : w.getStoryPoints())
                .sum();

        metricsMapper.insertCommitment(
                event.sprintId(), committedIds.size(), points, committedIds);
    }
}
