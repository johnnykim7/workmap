package com.therecommerce.workmap.admin.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.workmap.admin.dto.AdminDtos;
import com.therecommerce.workmap.admin.mapper.AdminWorkflowMapper;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.workflow.domain.Workflow;
import com.therecommerce.workmap.workflow.domain.WorkflowStatus;
import com.therecommerce.workmap.workflow.domain.WorkflowTransition;
import com.therecommerce.workmap.workitem.domain.CommonStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 워크플로 마스터 CRUD (WMP-ADM-003, POL-001, BIZ-010).
 *
 * <p>가드:
 * <ul>
 *   <li>시스템 워크플로(is_system, 시드 3종)는 수정·삭제 불가(WMP-7775).</li>
 *   <li>프로젝트가 사용 중인 워크플로/항목이 사용 중인 상태는 삭제 불가(WMP-7776/7778).</li>
 *   <li>common_status는 CommonStatus enum 값만(BIZ-106).</li>
 *   <li>전이의 from/to 상태는 해당 워크플로에 속해야 함(WMP-7781), 중복 전이 차단(WMP-7780).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class AdminWorkflowService {

    private final AdminWorkflowMapper mapper;

    // ───────────────────────── workflow ─────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<AdminDtos.WorkflowResponse> list(PageRequest page) {
        List<AdminDtos.WorkflowResponse> items = mapper
                .findAllWorkflows(page.getPageSize(), page.getOffset())
                .stream().map(this::toWorkflowResponse).toList();
        return PageResponse.of(items, mapper.countWorkflows(), page);
    }

    @Transactional
    public AdminDtos.WorkflowResponse create(AdminDtos.WorkflowRequest req) {
        Workflow wf = Workflow.builder().name(req.name()).isSystem(false).build();
        mapper.insertWorkflow(wf);
        return toWorkflowResponse(wf);
    }

    @Transactional
    public AdminDtos.WorkflowResponse update(Long id, AdminDtos.WorkflowRequest req) {
        Workflow wf = mustFindWorkflow(id);
        if (wf.isSystem()) {
            throw new BusinessException(WmpErrorCode.WORKFLOW_SYSTEM_PROTECTED);
        }
        wf.setName(req.name());
        mapper.updateWorkflow(wf);
        return toWorkflowResponse(wf);
    }

    @Transactional
    public void delete(Long id) {
        Workflow wf = mustFindWorkflow(id);
        if (wf.isSystem()) {
            throw new BusinessException(WmpErrorCode.WORKFLOW_SYSTEM_PROTECTED);
        }
        if (mapper.isWorkflowInUse(id)) {
            throw new BusinessException(WmpErrorCode.WORKFLOW_IN_USE);
        }
        mapper.deleteWorkflow(id);
    }

    // ───────────────────────── workflow_status ─────────────────────────

    @Transactional(readOnly = true)
    public List<AdminDtos.WorkflowStatusResponse> listStatuses(Long workflowId) {
        mustFindWorkflow(workflowId);
        return mapper.findStatuses(workflowId).stream()
                .map(AdminDtos.WorkflowStatusResponse::from).toList();
    }

    @Transactional
    public AdminDtos.WorkflowStatusResponse addStatus(Long workflowId, AdminDtos.WorkflowStatusRequest req) {
        Workflow wf = mustFindWorkflow(workflowId);
        if (wf.isSystem()) {
            throw new BusinessException(WmpErrorCode.WORKFLOW_SYSTEM_PROTECTED);
        }
        validateCommonStatus(req.commonStatus());
        WorkflowStatus s = WorkflowStatus.builder()
                .workflowId(workflowId)
                .code(req.code())
                .label(req.label())
                .commonStatus(req.commonStatus())
                .isStart(req.isStart() != null && req.isStart())
                .isDone(req.isDone() != null && req.isDone())
                .isApproval(req.isApproval() != null && req.isApproval())
                .approverRole(req.approverRole())
                .sortOrder(req.sortOrder() == null ? 0 : req.sortOrder())
                .build();
        mapper.insertStatus(s);
        return AdminDtos.WorkflowStatusResponse.from(s);
    }

    @Transactional
    public AdminDtos.WorkflowStatusResponse updateStatus(Long workflowId, Long statusId,
                                                         AdminDtos.WorkflowStatusRequest req) {
        Workflow wf = mustFindWorkflow(workflowId);
        if (wf.isSystem()) {
            throw new BusinessException(WmpErrorCode.WORKFLOW_SYSTEM_PROTECTED);
        }
        WorkflowStatus s = mustFindStatusInWorkflow(workflowId, statusId);
        validateCommonStatus(req.commonStatus());
        s.setCode(req.code());
        s.setLabel(req.label());
        s.setCommonStatus(req.commonStatus());
        s.setStart(req.isStart() != null && req.isStart());
        s.setDone(req.isDone() != null && req.isDone());
        s.setApproval(req.isApproval() != null && req.isApproval());
        s.setApproverRole(req.approverRole());
        if (req.sortOrder() != null) {
            s.setSortOrder(req.sortOrder());
        }
        mapper.updateStatus(s);
        return AdminDtos.WorkflowStatusResponse.from(s);
    }

    @Transactional
    public void deleteStatus(Long workflowId, Long statusId) {
        Workflow wf = mustFindWorkflow(workflowId);
        if (wf.isSystem()) {
            throw new BusinessException(WmpErrorCode.WORKFLOW_SYSTEM_PROTECTED);
        }
        mustFindStatusInWorkflow(workflowId, statusId);
        if (mapper.isStatusInUse(statusId)) {
            throw new BusinessException(WmpErrorCode.WORKFLOW_STATUS_IN_USE);
        }
        mapper.deleteTransitionsByStatus(statusId);  // 연결 전이 정리
        mapper.deleteStatus(statusId);
    }

    // ───────────────────────── workflow_transition ─────────────────────────

    @Transactional(readOnly = true)
    public List<AdminDtos.WorkflowTransitionResponse> listTransitions(Long workflowId) {
        mustFindWorkflow(workflowId);
        return mapper.findTransitions(workflowId).stream().map(this::toTransitionResponse).toList();
    }

    @Transactional
    public AdminDtos.WorkflowTransitionResponse addTransition(Long workflowId,
                                                             AdminDtos.WorkflowTransitionRequest req) {
        Workflow wf = mustFindWorkflow(workflowId);
        if (wf.isSystem()) {
            throw new BusinessException(WmpErrorCode.WORKFLOW_SYSTEM_PROTECTED);
        }
        // from/to 상태가 이 워크플로에 속하는지 검증(WMP-7781)
        mustFindStatusInWorkflow(workflowId, req.fromStatusId());
        mustFindStatusInWorkflow(workflowId, req.toStatusId());
        if (mapper.transitionExists(workflowId, req.fromStatusId(), req.toStatusId())) {
            throw new BusinessException(WmpErrorCode.WORKFLOW_TRANSITION_DUPLICATED);
        }
        WorkflowTransition t = WorkflowTransition.builder()
                .workflowId(workflowId)
                .fromStatusId(req.fromStatusId())
                .toStatusId(req.toStatusId())
                .build();
        mapper.insertTransition(t);
        return toTransitionResponse(t);
    }

    @Transactional
    public void deleteTransition(Long workflowId, Long transitionId) {
        Workflow wf = mustFindWorkflow(workflowId);
        if (wf.isSystem()) {
            throw new BusinessException(WmpErrorCode.WORKFLOW_SYSTEM_PROTECTED);
        }
        WorkflowTransition t = mapper.findTransitionById(transitionId);
        if (t == null || !t.getWorkflowId().equals(workflowId)) {
            throw new BusinessException(WmpErrorCode.WORKFLOW_TRANSITION_NOT_FOUND);
        }
        mapper.deleteTransition(transitionId);
    }

    // ───────────────────────── helpers ─────────────────────────

    private Workflow mustFindWorkflow(Long id) {
        Workflow wf = mapper.findWorkflowById(id);
        if (wf == null) {
            throw new BusinessException(WmpErrorCode.WORKFLOW_NOT_FOUND);
        }
        return wf;
    }

    private WorkflowStatus mustFindStatusInWorkflow(Long workflowId, Long statusId) {
        WorkflowStatus s = mapper.findStatusById(statusId);
        if (s == null || !s.getWorkflowId().equals(workflowId)) {
            throw new BusinessException(WmpErrorCode.WORKFLOW_STATUS_NOT_FOUND);
        }
        return s;
    }

    private void validateCommonStatus(String value) {
        try {
            CommonStatus.valueOf(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST,
                    "common_status는 TODO/IN_PROGRESS/IN_REVIEW/DONE/HOLD/BLOCKED 중 하나여야 합니다.");
        }
    }

    private AdminDtos.WorkflowResponse toWorkflowResponse(Workflow wf) {
        return new AdminDtos.WorkflowResponse(wf.getId(), wf.getName(), wf.isSystem());
    }

    private AdminDtos.WorkflowTransitionResponse toTransitionResponse(WorkflowTransition t) {
        return new AdminDtos.WorkflowTransitionResponse(
                t.getId(), t.getWorkflowId(), t.getFromStatusId(), t.getToStatusId());
    }
}
