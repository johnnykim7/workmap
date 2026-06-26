package com.therecommerce.workmap.approval.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.approval.domain.Approval;
import com.therecommerce.workmap.approval.domain.Decision;
import com.therecommerce.workmap.approval.mapper.ApprovalMapper;
import com.therecommerce.workmap.common.event.ApprovalEvents;
import com.therecommerce.workmap.workflow.domain.WorkflowStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * ApprovalGate 단위테스트 (T3-5 Sprint 4: APR-1/2/7). 게이트 진입 자동 생성 + PENDING 전이 차단.
 */
@ExtendWith(MockitoExtension.class)
class ApprovalGateTest {

    @Mock ApprovalMapper approvalMapper;
    @Mock org.springframework.context.ApplicationEventPublisher events;

    ApprovalGate gate;

    static final OffsetDateTime NOW = OffsetDateTime.of(2026, 6, 26, 10, 0, 0, 0, ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        gate = new ApprovalGate(approvalMapper, events);
    }

    private WorkflowStatus gateStatus(long id) {
        return WorkflowStatus.builder().id(id).workflowId(10L).code("REVIEW")
                .commonStatus("IN_REVIEW").isApproval(true).approverRole("MANAGER").build();
    }

    private WorkflowStatus normal(long id) {
        return WorkflowStatus.builder().id(id).workflowId(10L).code("TODO")
                .commonStatus("TODO").isApproval(false).build();
    }

    @Test
    @DisplayName("APR-1/7: 승인 게이트 상태 진입 시 PENDING 승인 행 생성 + ApprovalRequested 발행")
    void 게이트진입_PENDING자동생성_이벤트발행() {
        WorkflowStatus to = gateStatus(50L);
        // insert 후 id 채번 시뮬레이션
        doAnswer(inv -> { inv.getArgument(0, Approval.class).setId(999L); return null; })
                .when(approvalMapper).insert(any());

        gate.onEnterGate(to, 100L, 7L, NOW);

        ArgumentCaptor<Approval> ac = ArgumentCaptor.forClass(Approval.class);
        verify(approvalMapper).insert(ac.capture());
        assertThat(ac.getValue().getDecision()).isEqualTo(Decision.PENDING.name());
        assertThat(ac.getValue().getStatusId()).isEqualTo(50L);
        assertThat(ac.getValue().getApproverRole()).isEqualTo("MANAGER");

        ArgumentCaptor<ApprovalEvents.ApprovalRequested> ec =
                ArgumentCaptor.forClass(ApprovalEvents.ApprovalRequested.class);
        verify(events).publishEvent(ec.capture());
        assertThat(ec.getValue().workItemId()).isEqualTo(100L);
        assertThat(ec.getValue().approvalId()).isEqualTo(999L);
    }

    @Test
    @DisplayName("APR-1b: 비게이트 상태 진입 시 승인 행 생성 안 함")
    void 비게이트진입_생성안함() {
        gate.onEnterGate(normal(1L), 100L, 7L, NOW);
        verify(approvalMapper, never()).insert(any());
        verify(events, never()).publishEvent(any());
    }

    @Test
    @DisplayName("APR-2: 게이트 상태에서 PENDING 승인 남아있으면 다음 상태 전이 차단(BIZ-110)")
    void 게이트PENDING중_전이시도_차단() {
        WorkflowStatus from = gateStatus(50L);
        when(approvalMapper.countPendingByWorkItemAndStatus(100L, 50L)).thenReturn(1);

        assertThatThrownBy(() -> gate.assertCanLeave(from, 100L, false))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("APR-2b: 게이트 PENDING이어도 승인 결과 진행(bypass=true)이면 통과")
    void 게이트PENDING_bypass_통과() {
        WorkflowStatus from = gateStatus(50L);
        assertThatCode(() -> gate.assertCanLeave(from, 100L, true)).doesNotThrowAnyException();
        verify(approvalMapper, never()).countPendingByWorkItemAndStatus(anyLong(), anyLong());
    }

    @Test
    @DisplayName("APR-2c: PENDING 없으면(전원 결정) 전이 통과")
    void 게이트PENDING없음_통과() {
        WorkflowStatus from = gateStatus(50L);
        when(approvalMapper.countPendingByWorkItemAndStatus(100L, 50L)).thenReturn(0);
        assertThatCode(() -> gate.assertCanLeave(from, 100L, false)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("비게이트 상태에서 나갈 때는 승인 검사 없음")
    void 비게이트_검사없음() {
        assertThatCode(() -> gate.assertCanLeave(normal(1L), 100L, false)).doesNotThrowAnyException();
        verify(approvalMapper, never()).countPendingByWorkItemAndStatus(anyLong(), anyLong());
    }
}
