package com.therecommerce.workmap.board.service;

import com.therecommerce.workmap.agile.domain.Sprint;
import com.therecommerce.workmap.agile.domain.SprintStatus;
import com.therecommerce.workmap.agile.mapper.SprintMapper;
import com.therecommerce.workmap.board.dto.BoardDtos;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workflow.domain.WorkflowStatus;
import com.therecommerce.workmap.workflow.mapper.WorkflowMapper;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * BoardService 단위테스트 (T3-5 Sprint 4: BRD-1). 워크플로 상태별 컬럼 + 카드 분류.
 */
@ExtendWith(MockitoExtension.class)
class BoardServiceTest {

    @Mock ProjectMapper projectMapper;
    @Mock WorkflowMapper workflowMapper;
    @Mock SprintMapper sprintMapper;
    @Mock WorkItemMapper workItemMapper;

    BoardService service;

    @BeforeEach
    void setUp() {
        service = new BoardService(projectMapper, workflowMapper, sprintMapper, workItemMapper);
    }

    private WorkflowStatus status(long id, String code, int order) {
        return WorkflowStatus.builder().id(id).workflowId(10L).code(code).label(code)
                .commonStatus("TODO").sortOrder(order).build();
    }

    @Test
    @DisplayName("BRD-1: 보드 조회 시 워크플로 상태(sort_order)별 컬럼 + 카드 목록")
    void 보드조회_워크플로상태별컬럼() {
        when(projectMapper.findById(5L)).thenReturn(Project.builder().id(5L).workflowId(10L).build());
        when(sprintMapper.findActiveByProject(5L)).thenReturn(
                Sprint.builder().id(7L).status(SprintStatus.ACTIVE.name()).build());
        when(workItemMapper.findBySprint(7L)).thenReturn(List.of(
                WorkItem.builder().id(100L).statusId(1L).build(),
                WorkItem.builder().id(101L).statusId(2L).build(),
                WorkItem.builder().id(102L).statusId(2L).build()));
        when(workflowMapper.findStatuses(10L)).thenReturn(List.of(
                status(1L, "TODO", 0), status(2L, "IN_PROGRESS", 1), status(3L, "DONE", 2)));

        BoardDtos.BoardResponse res = service.board(5L);

        assertThat(res.sprintId()).isEqualTo(7L);
        assertThat(res.columns()).hasSize(3);
        assertThat(res.columns().get(0).code()).isEqualTo("TODO");
        assertThat(res.columns().get(0).cards()).hasSize(1);
        assertThat(res.columns().get(1).cards()).hasSize(2);   // statusId=2 카드 2장
        assertThat(res.columns().get(2).cards()).isEmpty();    // DONE 컬럼 비어있음
    }

    @Test
    @DisplayName("BRD-1b: ACTIVE 스프린트 없으면 프로젝트 전체 항목으로 보드 구성(운영형)")
    void ACTIVE스프린트없음_전체항목보드() {
        when(projectMapper.findById(5L)).thenReturn(Project.builder().id(5L).workflowId(10L).build());
        when(sprintMapper.findActiveByProject(5L)).thenReturn(null);
        when(workItemMapper.findByProjectAndSprint(5L, null, true)).thenReturn(List.of(
                WorkItem.builder().id(200L).statusId(1L).build()));
        when(workflowMapper.findStatuses(10L)).thenReturn(List.of(status(1L, "RECEIVED", 0)));

        BoardDtos.BoardResponse res = service.board(5L);

        assertThat(res.sprintId()).isNull();
        assertThat(res.columns().get(0).cards()).hasSize(1);
    }
}
