package com.therecommerce.workmap.agile.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.agile.domain.Sprint;
import com.therecommerce.workmap.agile.domain.SprintStatus;
import com.therecommerce.workmap.agile.dto.SprintDtos;
import com.therecommerce.workmap.agile.mapper.SprintMapper;
import com.therecommerce.workmap.common.event.SprintEvents;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
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
 * SprintService 단위테스트 (T3-5 Sprint 4: SPR-1~5, SPR-C1). 스프린트 FSM(T1-5).
 * Clock 고정, 이벤트는 ApplicationEventPublisher Mock으로 검증.
 */
@ExtendWith(MockitoExtension.class)
class SprintServiceTest {

    @Mock SprintMapper sprintMapper;
    @Mock ProjectMapper projectMapper;
    @Mock WorkItemMapper workItemMapper;
    @Mock org.springframework.context.ApplicationEventPublisher events;

    SprintService service;

    static final OffsetDateTime FIXED = OffsetDateTime.of(2026, 6, 26, 10, 0, 0, 0, ZoneOffset.UTC);
    Clock fixedClock = Clock.fixed(FIXED.toInstant(), ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        service = new SprintService(sprintMapper, projectMapper, workItemMapper, events, fixedClock);
    }

    private Sprint sprint(long id, String status) {
        return Sprint.builder().id(id).projectId(5L).name("스프린트 " + id).status(status).build();
    }

    @Test
    @DisplayName("SPR-C1: 유효 DTO로 생성 시 status=FUTURE")
    void POST_sprints_FUTURE() {
        when(projectMapper.findById(5L)).thenReturn(Project.builder().id(5L).build());
        when(sprintMapper.maxSortOrder(5L)).thenReturn(2);
        when(sprintMapper.findById(any())).thenReturn(sprint(10L, SprintStatus.FUTURE.name()));

        SprintDtos.Response res = service.create(5L,
                new SprintDtos.CreateRequest("스프린트 1", "목표", null, null), 99L);

        assertThat(res.status()).isEqualTo("FUTURE");
        ArgumentCaptor<Sprint> cap = ArgumentCaptor.forClass(Sprint.class);
        verify(sprintMapper).insert(cap.capture());
        assertThat(cap.getValue().getStatus()).isEqualTo("FUTURE");
        assertThat(cap.getValue().getSortOrder()).isEqualTo(3);  // max+1
    }

    @Test
    @DisplayName("SPR-1: 앞 스프린트 ACTIVE 중 다음 시작 시 거부")
    void 앞스프린트ACTIVE중_다음시작_거부() {
        when(sprintMapper.findById(11L)).thenReturn(sprint(11L, SprintStatus.FUTURE.name()));
        when(sprintMapper.findActiveByProject(5L)).thenReturn(sprint(10L, SprintStatus.ACTIVE.name()));

        assertThatThrownBy(() -> service.start(11L, null, 99L))
                .isInstanceOf(BusinessException.class);
        verify(sprintMapper, never()).updateStart(any());
    }

    @Test
    @DisplayName("SPR-2: 스프린트 시작 → ACTIVE, 기간 고정, SprintStarted 발행")
    void 스프린트시작_기간고정_SprintStarted발행() {
        Sprint s = sprint(11L, SprintStatus.FUTURE.name());
        when(sprintMapper.findById(11L)).thenReturn(s);
        when(sprintMapper.findActiveByProject(5L)).thenReturn(null);
        when(workItemMapper.findBySprint(11L)).thenReturn(List.of(
                WorkItem.builder().id(100L).build(), WorkItem.builder().id(101L).build()));

        LocalDate start = LocalDate.of(2026, 6, 26);
        LocalDate end = LocalDate.of(2026, 7, 9);
        service.start(11L, new SprintDtos.StartRequest(start, end), 99L);

        verify(sprintMapper).updateStart(argThat(sp ->
                sp.getStartDate().equals(start) && sp.getEndDate().equals(end)
                        && sp.getStartedAt() != null));

        ArgumentCaptor<SprintEvents.SprintStarted> cap = ArgumentCaptor.forClass(SprintEvents.SprintStarted.class);
        verify(events).publishEvent(cap.capture());
        assertThat(cap.getValue().committedItems()).containsExactly(100L, 101L);
        assertThat(cap.getValue().startDate()).isEqualTo(start);
        assertThat(cap.getValue().endDate()).isEqualTo(end);
    }

    @Test
    @DisplayName("SPR-3: 스프린트 완료 → COMPLETED, 미완료 이월, SprintCompleted 발행")
    void 스프린트완료_미완료이월_SprintCompleted발행() {
        Sprint active = sprint(10L, SprintStatus.ACTIVE.name());
        when(sprintMapper.findById(10L)).thenReturn(active);
        when(sprintMapper.findById(20L)).thenReturn(sprint(20L, SprintStatus.FUTURE.name()));
        when(workItemMapper.findDoneBySprint(10L)).thenReturn(List.of(WorkItem.builder().id(100L).build()));
        when(workItemMapper.findUnfinishedBySprint(10L)).thenReturn(List.of(
                WorkItem.builder().id(101L).build(), WorkItem.builder().id(102L).build()));

        SprintDtos.CompleteResult res = service.complete(10L, new SprintDtos.CompleteRequest(20L), 99L);

        assertThat(res.doneCount()).isEqualTo(1);
        assertThat(res.carriedOverCount()).isEqualTo(2);
        verify(workItemMapper).updateSprint(101L, 20L);   // 다음 스프린트로 이월
        verify(workItemMapper).updateSprint(102L, 20L);
        verify(sprintMapper).updateComplete(eq(10L), any());

        ArgumentCaptor<SprintEvents.SprintCompleted> cap = ArgumentCaptor.forClass(SprintEvents.SprintCompleted.class);
        verify(events).publishEvent(cap.capture());
        assertThat(cap.getValue().doneItems()).containsExactly(100L);
        assertThat(cap.getValue().carriedOverItems()).hasSize(2);
    }

    @Test
    @DisplayName("SPR-3b: 이월 대상 미지정 시 백로그(null)로 이월")
    void 스프린트완료_이월대상미지정_백로그이월() {
        when(sprintMapper.findById(10L)).thenReturn(sprint(10L, SprintStatus.ACTIVE.name()));
        when(workItemMapper.findDoneBySprint(10L)).thenReturn(List.of());
        when(workItemMapper.findUnfinishedBySprint(10L)).thenReturn(List.of(WorkItem.builder().id(101L).build()));

        service.complete(10L, new SprintDtos.CompleteRequest(null), 99L);

        verify(workItemMapper).updateSprint(101L, null);  // 백로그로
    }

    @Test
    @DisplayName("SPR-4: COMPLETED 스프린트 시작 시도 거부")
    void COMPLETED_시작_거부() {
        when(sprintMapper.findById(10L)).thenReturn(sprint(10L, SprintStatus.COMPLETED.name()));

        assertThatThrownBy(() -> service.start(10L, null, 99L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("SPR-4b: ACTIVE 아닌 스프린트 완료 시도 거부")
    void 비ACTIVE_완료_거부() {
        when(sprintMapper.findById(11L)).thenReturn(sprint(11L, SprintStatus.FUTURE.name()));

        assertThatThrownBy(() -> service.complete(11L, null, 99L))
                .isInstanceOf(BusinessException.class);
        verify(sprintMapper, never()).updateComplete(any(), any());
    }
}
