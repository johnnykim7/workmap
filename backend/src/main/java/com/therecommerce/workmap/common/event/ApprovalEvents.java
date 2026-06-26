package com.therecommerce.workmap.common.event;

import java.time.OffsetDateTime;

/**
 * 승인 게이트 도메인 이벤트(T1-6, WMP-OPS-006).
 * 게이트 진입 시 ApprovalRequested, 승인/거부 처리 시 ApprovalDecided를 발행한다.
 * 승인 행 생성·상태 전이(전진/반려)는 동일 트랜잭션(work_item 상태 정합), 알림은 AFTER_COMMIT 비동기.
 */
public final class ApprovalEvents {

    private ApprovalEvents() {}

    /** WMP-OPS-006, BIZ-110 — 멱등 키=approvalId. */
    public record ApprovalRequested(
            Long approvalId,
            Long workItemId,
            Long statusId,
            Long approverId,
            String approverRole,
            Long requestedBy,
            OffsetDateTime requestedAt
    ) {}

    /** WMP-OPS-006, BIZ-111 — decision=APPROVED/REJECTED. 멱등 키=approvalId+decidedBy+decidedAt. */
    public record ApprovalDecided(
            Long approvalId,
            Long workItemId,
            String decision,
            Long decidedBy,
            String comment,
            OffsetDateTime decidedAt
    ) {}
}
