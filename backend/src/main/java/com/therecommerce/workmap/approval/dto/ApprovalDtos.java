package com.therecommerce.workmap.approval.dto;

import com.therecommerce.workmap.approval.domain.Approval;
import jakarta.validation.constraints.NotBlank;

import java.time.OffsetDateTime;

/** 승인 API DTO(T3-2 H1, WMP-OPS-006). */
public final class ApprovalDtos {

    private ApprovalDtos() {}

    /**
     * 승인/거부 처리(APR-4/5). decision=APPROVE|REJECT.
     * <ul>
     *   <li>APPROVE: 전원 승인되면 nextStatusId로 work_item 전이(FSM 가드 경유).</li>
     *   <li>REJECT: rejectStatusId로 반려 전이 + comment 사유.</li>
     * </ul>
     * nextStatusId/rejectStatusId 미지정 시 상태 전이 없이 결정만 기록한다.
     */
    public record DecisionRequest(
            @NotBlank String decision,   // APPROVE | REJECT
            String comment,
            Long nextStatusId,           // APPROVE 시 진행할 상태(전원 승인 시)
            Long rejectStatusId          // REJECT 시 반려할 상태
    ) {}

    public record Response(
            Long id,
            Long workItemId,
            Long statusId,
            Long requestedBy,
            Long approverId,
            String approverRole,
            String decision,
            String comment,
            Long decidedBy,
            OffsetDateTime decidedAt,
            OffsetDateTime createdAt
    ) {
        public static Response from(Approval a) {
            return new Response(a.getId(), a.getWorkItemId(), a.getStatusId(), a.getRequestedBy(),
                    a.getApproverId(), a.getApproverRole(), a.getDecision(), a.getComment(),
                    a.getDecidedBy(), a.getDecidedAt(), a.getCreatedAt());
        }
    }
}
