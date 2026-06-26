package com.therecommerce.workmap.admin.mapper;

import com.therecommerce.workmap.workflow.domain.Workflow;
import com.therecommerce.workmap.workflow.domain.WorkflowStatus;
import com.therecommerce.workmap.workflow.domain.WorkflowTransition;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 워크플로 마스터 CRUD 매퍼 (WMP-ADM-003, POL-001).
 * FSM 가드 조회는 {@code WorkflowMapper}(읽기 전용)가, 편집은 여기서 분리 담당한다.
 */
@Mapper
public interface AdminWorkflowMapper {

    // ── workflow ──
    List<Workflow> findAllWorkflows(@Param("limit") int limit, @Param("offset") int offset);

    long countWorkflows();

    Workflow findWorkflowById(@Param("id") Long id);

    void insertWorkflow(Workflow workflow);

    void updateWorkflow(Workflow workflow);

    void deleteWorkflow(@Param("id") Long id);

    /** 프로젝트(projects.workflow_id) 사용 중 여부 — 삭제 가드. */
    boolean isWorkflowInUse(@Param("id") Long id);

    // ── workflow_status ──
    List<WorkflowStatus> findStatuses(@Param("workflowId") Long workflowId);

    WorkflowStatus findStatusById(@Param("id") Long id);

    void insertStatus(WorkflowStatus status);

    void updateStatus(WorkflowStatus status);

    void deleteStatus(@Param("id") Long id);

    /** 업무 항목(work_items.status_id) 사용 중 여부 — 상태 삭제 가드. */
    boolean isStatusInUse(@Param("id") Long id);

    /** 상태 삭제 시 연결된 전이도 제거(from/to 어느 쪽이든). */
    void deleteTransitionsByStatus(@Param("statusId") Long statusId);

    // ── workflow_transition ──
    List<WorkflowTransition> findTransitions(@Param("workflowId") Long workflowId);

    WorkflowTransition findTransitionById(@Param("id") Long id);

    boolean transitionExists(@Param("workflowId") Long workflowId,
                             @Param("fromStatusId") Long fromStatusId,
                             @Param("toStatusId") Long toStatusId);

    void insertTransition(WorkflowTransition transition);

    void deleteTransition(@Param("id") Long id);
}
