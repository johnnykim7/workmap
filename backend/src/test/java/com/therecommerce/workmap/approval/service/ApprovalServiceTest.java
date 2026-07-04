package com.therecommerce.workmap.approval.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.approval.domain.Approval;
import com.therecommerce.workmap.approval.domain.Decision;
import com.therecommerce.workmap.approval.dto.ApprovalDtos;
import com.therecommerce.workmap.approval.mapper.ApprovalMapper;
import com.therecommerce.workmap.common.event.ApprovalEvents;
import com.therecommerce.workmap.member.mapper.ProjectMemberMapper;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import com.therecommerce.workmap.workitem.service.WorkItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * ApprovalService 단위테스트 (T3-5 Sprint 4: APR-3/4/5/6/8). 승인 결정 + 상태 전이 + 권한.
 * (APR-1/2/7은 게이트 훅 — {@link ApprovalGateTest}에서 검증.)
 */
@ExtendWith(MockitoExtension.class)
class ApprovalServiceTest {

    @Mock ApprovalMapper approvalMapper;
    @Mock ProjectMemberMapper memberMapper;
    @Mock ProjectMapper projectMapper;
    @Mock WorkItemMapper workItemMapper;
    @Mock WorkItemService workItemService;
    @Mock org.springframework.context.ApplicationEventPublisher events;

    ApprovalService service;

    static final OffsetDateTime FIXED = OffsetDateTime.of(2026, 6, 26, 10, 0, 0, 0, ZoneOffset.UTC);
    Clock fixedClock = Clock.fixed(FIXED.toInstant(), ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        service = new ApprovalService(approvalMapper, memberMapper, projectMapper,
                workItemMapper, workItemService, events, fixedClock);
    }

    private Approval pending(long id, Long approverId, String approverRole) {
        return Approval.builder().id(id).workItemId(100L).statusId(50L)
                .requestedBy(1L).approverId(approverId).approverRole(approverRole)
                .decision(Decision.PENDING.name()).build();
    }

    @Test
    @DisplayName("APR-3: 지정 승인자 아닌 사용자가 처리 시 거부")
    void 비승인자_승인처리_거부() {
        when(approvalMapper.findById(1L)).thenReturn(pending(1L, 7L, null));   // 지정 승인자=7
        when(workItemMapper.findById(100L)).thenReturn(WorkItem.builder().id(100L).projectId(5L).build());

        assertThatThrownBy(() -> service.decide(1L,
                new ApprovalDtos.DecisionRequest("APPROVE", null, 60L, null), 99L))  // 다른 사용자=99
                .isInstanceOf(BusinessException.class);
        verify(workItemService, never()).changeStatus(anyLong(), any(), anyLong(), anyBoolean());
    }

    @Test
    @DisplayName("APR-4: 승인자 APPROVE → 전원 승인 시 다음 상태로 전이 + ApprovalDecided 발행")
    void 승인자_APPROVE_다음상태전이허용() {
        Approval a = pending(1L, 7L, null);
        when(approvalMapper.findById(1L)).thenReturn(a);
        when(workItemMapper.findById(100L)).thenReturn(WorkItem.builder().id(100L).projectId(5L).build());
        // 전원 APPROVED 상태(자신이 방금 승인됨)
        Approval approved = pending(1L, 7L, null);
        approved.setDecision(Decision.APPROVED.name());
        when(approvalMapper.findByWorkItemAndStatus(100L, 50L)).thenReturn(List.of(approved));

        service.decide(1L, new ApprovalDtos.DecisionRequest("APPROVE", "ok", 60L, null), 7L);

        verify(approvalMapper).updateDecision(eq(1L), eq("APPROVED"), eq("ok"), eq(7L), any());
        // 다음 상태(60)로 전이, bypassApproval=true
        verify(workItemService).changeStatus(eq(100L),
                argThat(r -> r.toStatusId().equals(60L)), eq(7L), eq(true));

        ArgumentCaptor<ApprovalEvents.ApprovalDecided> cap =
                ArgumentCaptor.forClass(ApprovalEvents.ApprovalDecided.class);
        verify(events).publishEvent(cap.capture());
        assertThat(cap.getValue().decision()).isEqualTo("APPROVED");
    }

    @Test
    @DisplayName("APR-5: 승인자 REJECT → 반려 상태로 전이 + 사유")
    void 승인자_REJECT_반려전이() {
        when(approvalMapper.findById(1L)).thenReturn(pending(1L, 7L, null));
        when(workItemMapper.findById(100L)).thenReturn(WorkItem.builder().id(100L).projectId(5L).build());

        service.decide(1L, new ApprovalDtos.DecisionRequest("REJECT", "보완 필요", null, 40L), 7L);

        verify(approvalMapper).updateDecision(eq(1L), eq("REJECTED"), eq("보완 필요"), eq(7L), any());
        verify(workItemService).changeStatus(eq(100L),
                argThat(r -> r.toStatusId().equals(40L)),
                eq(7L), eq(true));
    }

    @Test
    @DisplayName("APR-6: 다수 승인 — 아직 미승인 건 남으면 다음 상태로 전이하지 않음(POL-011)")
    void 다수승인_일부미승인_미전이() {
        Approval a = pending(1L, 7L, null);
        when(approvalMapper.findById(1L)).thenReturn(a);
        when(workItemMapper.findById(100L)).thenReturn(WorkItem.builder().id(100L).projectId(5L).build());
        // 한 건은 APPROVED, 다른 한 건은 여전히 PENDING
        Approval approved = pending(1L, 7L, null); approved.setDecision(Decision.APPROVED.name());
        Approval stillPending = pending(2L, 8L, null);
        when(approvalMapper.findByWorkItemAndStatus(100L, 50L)).thenReturn(List.of(approved, stillPending));

        service.decide(1L, new ApprovalDtos.DecisionRequest("APPROVE", null, 60L, null), 7L);

        verify(workItemService, never()).changeStatus(anyLong(), any(), anyLong(), anyBoolean());
    }

    @Test
    @DisplayName("APR-X: 이미 처리된 승인 재처리 시 거부")
    void 이미처리된승인_재처리_거부() {
        Approval decided = pending(1L, 7L, null);
        decided.setDecision(Decision.APPROVED.name());
        when(approvalMapper.findById(1L)).thenReturn(decided);

        assertThatThrownBy(() -> service.decide(1L,
                new ApprovalDtos.DecisionRequest("APPROVE", null, 60L, null), 7L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("APR-3b: 역할 기반 승인자 — 일치하는 역할이면 처리 허용")
    void 역할기반_일치역할_허용() {
        when(approvalMapper.findById(1L)).thenReturn(pending(1L, null, "MANAGER"));
        when(workItemMapper.findById(100L)).thenReturn(WorkItem.builder().id(100L).projectId(5L).build());
        when(memberMapper.findRole(5L, 7L)).thenReturn("MANAGER");
        Approval approved = pending(1L, null, "MANAGER"); approved.setDecision(Decision.APPROVED.name());
        when(approvalMapper.findByWorkItemAndStatus(100L, 50L)).thenReturn(List.of(approved));

        service.decide(1L, new ApprovalDtos.DecisionRequest("APPROVE", null, 60L, null), 7L);

        verify(approvalMapper).updateDecision(eq(1L), eq("APPROVED"), any(), eq(7L), any());
    }
}
