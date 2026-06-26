package com.therecommerce.workmap.approval.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * 승인(approvals, WMP-OPS-006). work_item이 승인 게이트 상태(is_approval) 진입 시 PENDING 행 자동 생성.
 * 승인/거부 처리 시 decision/decided_by/decided_at 기록. 다수 승인은 같은 status_id에 여러 행(POL-011).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Approval {
    private Long id;
    private Long workItemId;
    private Long statusId;          // 승인 게이트 상태(이 상태 통과를 위한 승인)
    private Long requestedBy;
    private Long approverId;        // 지정 승인자(있으면 우선)
    private String approverRole;    // 역할 기반 승인자(approverId 없을 때)
    private String decision;        // PENDING / APPROVED / REJECTED
    private String comment;
    private Long decidedBy;
    private OffsetDateTime decidedAt;
    private OffsetDateTime createdAt;
}
