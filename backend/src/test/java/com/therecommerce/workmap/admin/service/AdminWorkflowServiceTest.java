package com.therecommerce.workmap.admin.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.admin.dto.AdminDtos;
import com.therecommerce.workmap.admin.mapper.AdminWorkflowMapper;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.workflow.domain.Workflow;
import com.therecommerce.workmap.workflow.domain.WorkflowStatus;
import com.therecommerce.workmap.workflow.domain.WorkflowTransition;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * AdminWorkflowService 단위테스트 (WMP-ADM-003, POL-001, BIZ-010):
 * 시스템 보호 / 사용중 가드 / common_status 검증 / 전이 소속·중복 검증.
 */
@ExtendWith(MockitoExtension.class)
class AdminWorkflowServiceTest {

    @Mock AdminWorkflowMapper mapper;
    AdminWorkflowService service;

    @BeforeEach
    void setUp() {
        service = new AdminWorkflowService(mapper);
    }

    private Workflow custom() { return Workflow.builder().id(10L).name("커스텀").isSystem(false).build(); }

    @Test
    @DisplayName("워크플로수정_시스템_거부됨")
    void 수정_시스템보호() {
        when(mapper.findWorkflowById(1L)).thenReturn(
                Workflow.builder().id(1L).name("개발형").isSystem(true).build());

        assertThatThrownBy(() -> service.update(1L, new AdminDtos.WorkflowRequest("변경")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.WORKFLOW_SYSTEM_PROTECTED);
    }

    @Test
    @DisplayName("워크플로삭제_프로젝트사용중_거부됨")
    void 삭제_사용중가드() {
        when(mapper.findWorkflowById(10L)).thenReturn(custom());
        when(mapper.isWorkflowInUse(10L)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(10L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.WORKFLOW_IN_USE);
        verify(mapper, never()).deleteWorkflow(any());
    }

    @Test
    @DisplayName("상태추가_잘못된공통상태_거부됨")
    void 상태추가_공통상태검증() {
        when(mapper.findWorkflowById(10L)).thenReturn(custom());
        AdminDtos.WorkflowStatusRequest req = new AdminDtos.WorkflowStatusRequest(
                "REVIEW", "검토", "WRONG", false, false, false, null, 1);

        assertThatThrownBy(() -> service.addStatus(10L, req))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.INVALID_REQUEST);
        verify(mapper, never()).insertStatus(any());
    }

    @Test
    @DisplayName("상태추가_정상_저장됨")
    void 상태추가_성공() {
        when(mapper.findWorkflowById(10L)).thenReturn(custom());
        AdminDtos.WorkflowStatusRequest req = new AdminDtos.WorkflowStatusRequest(
                "REVIEW", "검토", "IN_REVIEW", false, false, false, null, 1);

        AdminDtos.WorkflowStatusResponse res = service.addStatus(10L, req);

        assertThat(res.commonStatus()).isEqualTo("IN_REVIEW");
        verify(mapper).insertStatus(any(WorkflowStatus.class));
    }

    @Test
    @DisplayName("상태삭제_업무사용중_거부됨")
    void 상태삭제_사용중가드() {
        when(mapper.findWorkflowById(10L)).thenReturn(custom());
        when(mapper.findStatusById(20L)).thenReturn(
                WorkflowStatus.builder().id(20L).workflowId(10L).build());
        when(mapper.isStatusInUse(20L)).thenReturn(true);

        assertThatThrownBy(() -> service.deleteStatus(10L, 20L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.WORKFLOW_STATUS_IN_USE);
        verify(mapper, never()).deleteStatus(any());
    }

    @Test
    @DisplayName("전이추가_타워크플로상태_거부됨")
    void 전이추가_소속검증() {
        when(mapper.findWorkflowById(10L)).thenReturn(custom());
        when(mapper.findStatusById(20L)).thenReturn(
                WorkflowStatus.builder().id(20L).workflowId(10L).build());
        when(mapper.findStatusById(30L)).thenReturn(
                WorkflowStatus.builder().id(30L).workflowId(99L).build());  // 다른 워크플로

        assertThatThrownBy(() -> service.addTransition(10L,
                new AdminDtos.WorkflowTransitionRequest(20L, 30L)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.WORKFLOW_STATUS_NOT_FOUND);
        verify(mapper, never()).insertTransition(any());
    }

    @Test
    @DisplayName("전이추가_중복_거부됨")
    void 전이추가_중복검증() {
        when(mapper.findWorkflowById(10L)).thenReturn(custom());
        when(mapper.findStatusById(20L)).thenReturn(
                WorkflowStatus.builder().id(20L).workflowId(10L).build());
        when(mapper.findStatusById(21L)).thenReturn(
                WorkflowStatus.builder().id(21L).workflowId(10L).build());
        when(mapper.transitionExists(10L, 20L, 21L)).thenReturn(true);

        assertThatThrownBy(() -> service.addTransition(10L,
                new AdminDtos.WorkflowTransitionRequest(20L, 21L)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.WORKFLOW_TRANSITION_DUPLICATED);
    }

    @Test
    @DisplayName("전이추가_정상_저장됨")
    void 전이추가_성공() {
        when(mapper.findWorkflowById(10L)).thenReturn(custom());
        when(mapper.findStatusById(20L)).thenReturn(
                WorkflowStatus.builder().id(20L).workflowId(10L).build());
        when(mapper.findStatusById(21L)).thenReturn(
                WorkflowStatus.builder().id(21L).workflowId(10L).build());
        when(mapper.transitionExists(10L, 20L, 21L)).thenReturn(false);

        AdminDtos.WorkflowTransitionResponse res = service.addTransition(10L,
                new AdminDtos.WorkflowTransitionRequest(20L, 21L));

        assertThat(res.fromStatusId()).isEqualTo(20L);
        assertThat(res.toStatusId()).isEqualTo(21L);
        verify(mapper).insertTransition(any(WorkflowTransition.class));
    }
}
