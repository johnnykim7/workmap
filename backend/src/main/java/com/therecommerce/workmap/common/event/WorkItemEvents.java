package com.therecommerce.workmap.common.event;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * 업무 항목 도메인 이벤트(T1-6, Phase 1 인프로세스 발행).
 * Spring ApplicationEvent로 발행하고, 알림 유발 이벤트는 {@code @TransactionalEventListener(AFTER_COMMIT)}
 * 비동기 리스너가 소비한다(본 트랜잭션과 분리). 페이로드 필드는 T1-6 계약 그대로.
 *
 * <p>이 파일이 묶는 이벤트(Phase 1 발행 8종 중 work_item 관련 6종):
 * WorkItemCreated / WorkItemAssigned / WorkItemStatusChanged / WorkItemBlocked /
 * WorkItemMentioned / MeasureUpdated.
 */
public final class WorkItemEvents {

    private WorkItemEvents() {}

    /** WMP-WI-001 — 멱등 키=workItemId. */
    public record WorkItemCreated(
            Long workItemId,
            Long projectId,
            String issueType,
            Long parentId,
            Long assigneeId,
            Long createdBy,
            OffsetDateTime createdAt
    ) {}

    /** WMP-WI-006 — 멱등 키=workItemId+assigneeId+assignedAt. */
    public record WorkItemAssigned(
            Long workItemId,
            Long assigneeId,
            Long previousAssigneeId,
            Long assignedBy,
            OffsetDateTime assignedAt
    ) {}

    /** WMP-WI-007 — 멱등 키=workItemId+changedAt. */
    public record WorkItemStatusChanged(
            Long workItemId,
            String issueType,
            String fromStatus,
            String toStatus,
            Long changedBy,
            OffsetDateTime changedAt
    ) {}

    /** WMP-WI-007 — BLOCKED 전이. 멱등 키=workItemId+blockedAt. */
    public record WorkItemBlocked(
            Long workItemId,
            String issueType,
            String blockReason,
            Long blockedBy,
            OffsetDateTime blockedAt,
            Long assigneeId,
            List<Long> mentionedUserIds
    ) {}

    /** WMP-WI-009 — 댓글 멘션. 멱등 키=commentId. */
    public record WorkItemMentioned(
            Long workItemId,
            Long commentId,
            Long authorId,
            List<Long> mentionedUserIds,
            OffsetDateTime mentionedAt
    ) {}

    /** WMP-WI-009 (CR-028) — 멘션 없는 일반 댓글. 담당자에게 알림. 멱등 키=commentId. */
    public record WorkItemCommented(
            Long workItemId,
            Long commentId,
            Long authorId,
            Long assigneeId,
            OffsetDateTime commentedAt
    ) {}

    /** WMP-WI-016 — 측정 현재값 변경. 멱등 키=workItemId+updatedAt. */
    public record MeasureUpdated(
            Long workItemId,
            Long measureUnitId,
            BigDecimal targetValue,
            BigDecimal currentValue,
            BigDecimal previousValue,
            String valueType,
            Long updatedBy,
            OffsetDateTime updatedAt
    ) {}
}
