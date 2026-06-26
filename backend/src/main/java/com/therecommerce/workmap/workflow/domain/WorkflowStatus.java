package com.therecommerce.workmap.workflow.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * workflow_status 마스터 행 (T3-1, POL-001, T1-5).
 * 워크플로별 상태 코드와 집계용 공통 상태군(common_status), 시작/완료/승인게이트 플래그를 보유한다.
 * FSM 가드(WorkItemService.changeStatus)와 보드 컬럼 구성의 데이터 소스.
 * 관리자 CRUD(WMP-ADM-003)의 insert/setter 매핑을 위해 no-arg 생성자 보유(CR-008).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowStatus {

    private Long id;
    private Long workflowId;
    private String code;
    private String label;
    private String commonStatus;   // CommonStatusGroup 환산값(TODO/IN_PROGRESS/IN_REVIEW/DONE/HOLD/BLOCKED)
    private boolean isStart;        // 시작 상태(BIZ-101) — 생성 시 이 상태로 고정
    private boolean isDone;         // 완료 상태 — 진입 시 completed_at 자동(BIZ-006)
    private boolean isApproval;     // 승인 게이트(WMP-OPS-005)
    private String approverRole;
    private int sortOrder;
}
