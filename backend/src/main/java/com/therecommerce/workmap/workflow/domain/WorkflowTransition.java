package com.therecommerce.workmap.workflow.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * workflow_transition 화이트리스트 행 (T3-1, BIZ-010, WMP-ADM-003).
 * 이 테이블에 없는 (from→to)는 FSM 가드에서 전면 차단된다.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowTransition {

    private Long id;
    private Long workflowId;
    private Long fromStatusId;
    private Long toStatusId;
}
