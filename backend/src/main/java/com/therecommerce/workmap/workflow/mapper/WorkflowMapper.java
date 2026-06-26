package com.therecommerce.workmap.workflow.mapper;

import com.therecommerce.workmap.workflow.domain.WorkflowStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 워크플로 마스터(상태/전이) 조회 매퍼 — FSM 가드의 데이터 소스(POL-001, BIZ-010).
 * 상태 전이 검증은 workflow_transition 화이트리스트(uniq_wf_transition)로만 판단한다.
 */
@Mapper
public interface WorkflowMapper {

    /** 워크플로의 모든 상태(보드 컬럼 순서). */
    List<WorkflowStatus> findStatuses(@Param("workflowId") Long workflowId);

    WorkflowStatus findStatusById(@Param("statusId") Long statusId);

    /** 워크플로의 시작 상태(is_start=true) — 항목 생성 시 고정(BIZ-101). */
    WorkflowStatus findStartStatus(@Param("workflowId") Long workflowId);

    /** 워크플로 내 code로 상태 조회. */
    WorkflowStatus findStatusByCode(@Param("workflowId") Long workflowId,
                                    @Param("code") String code);

    /** from→to 전이가 화이트리스트에 존재하는지(BIZ-010). */
    boolean transitionExists(@Param("workflowId") Long workflowId,
                             @Param("fromStatusId") Long fromStatusId,
                             @Param("toStatusId") Long toStatusId);
}
