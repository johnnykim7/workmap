package com.therecommerce.workmap.common.event;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * 스프린트 도메인 이벤트(T1-6, Phase 1 인프로세스 발행).
 * 시작/완료 시 발행하며, 알림·번다운 스냅샷 등은 {@code @TransactionalEventListener(AFTER_COMMIT)}
 * 비동기 리스너가 소비한다(본 트랜잭션과 분리). 이월 처리만 동일 트랜잭션(T1-6 정합성 전략).
 */
public final class SprintEvents {

    private SprintEvents() {}

    /** WMP-AGL-003 — 멱등 키=sprintId+startDate. */
    public record SprintStarted(
            Long sprintId,
            Long projectId,
            List<Long> committedItems,
            LocalDate startDate,
            LocalDate endDate,
            Long startedBy,
            OffsetDateTime startedAt
    ) {}

    /** 이월 항목 한 건(다음 스프린트 또는 백로그로 이동). */
    public record CarriedOver(
            Long workItemId,
            /** 이월 대상 sprintId, 또는 백로그로 빠지면 null. */
            Long carriedToSprintId
    ) {}

    /** WMP-AGL-004 — 멱등 키=sprintId+completedAt. */
    public record SprintCompleted(
            Long sprintId,
            Long projectId,
            List<Long> doneItems,
            List<CarriedOver> carriedOverItems,
            OffsetDateTime completedAt,
            Long completedBy
    ) {}
}
