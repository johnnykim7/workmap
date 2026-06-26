package com.therecommerce.workmap.ops.service;

import com.therecommerce.workmap.ops.dto.OpsDtos;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.WorkItemLinkMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import com.therecommerce.workmap.workitem.service.WorkItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * OperationsService 단위테스트 (T3-5 Sprint 4: OPS-002 처리량 / OPS-003 백로그 전환).
 */
@ExtendWith(MockitoExtension.class)
class OperationsServiceTest {

    @Mock WorkItemMapper workItemMapper;
    @Mock WorkItemLinkMapper linkMapper;
    @Mock ProjectMapper projectMapper;
    @Mock WorkItemService workItemService;

    OperationsService service;

    Clock fixedClock = Clock.fixed(
            OffsetDateTime.of(2026, 6, 26, 10, 0, 0, 0, ZoneOffset.UTC).toInstant(), ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        service = new OperationsService(workItemMapper, linkMapper, projectMapper, workItemService, fixedClock);
    }

    @Test
    @DisplayName("OPS-002: 기간 내 완료 항목을 담당자별로 집계")
    void 처리량_담당자별집계() {
        when(projectMapper.findById(5L)).thenReturn(Project.builder().id(5L).build());
        when(workItemMapper.findCompletedBetween(eq(5L), any(), any())).thenReturn(List.of(
                WorkItem.builder().id(1L).assigneeId(7L).build(),
                WorkItem.builder().id(2L).assigneeId(7L).build(),
                WorkItem.builder().id(3L).assigneeId(8L).build(),
                WorkItem.builder().id(4L).assigneeId(null).build()));   // 미배정

        OpsDtos.ThroughputResponse res = service.throughput(5L,
                LocalDate.of(2026, 6, 20), LocalDate.of(2026, 6, 26));

        assertThat(res.totalDone()).isEqualTo(4);
        assertThat(res.byAssignee()).anySatisfy(a -> {
            if (a.assigneeId() != null && a.assigneeId() == 7L) assertThat(a.doneCount()).isEqualTo(2);
        });
        assertThat(res.byAssignee()).anySatisfy(a ->
                assertThat(a.assigneeId()).isNull());   // 미배정 집계 포함
    }

    @Test
    @DisplayName("OPS-003: 현장 이슈 → 개발 백로그 신규 항목 생성 + 원본↔신규 양방향 링크")
    void 백로그전환_신규생성_양방향링크() {
        WorkItem origin = WorkItem.builder().id(100L).projectId(5L).title("현장 오류")
                .priority("HIGH").description("desc").build();
        when(workItemService.getEntity(100L)).thenReturn(origin);
        when(workItemService.create(any(), eq(99L)))
                .thenReturn(stubResponse(200L));

        OpsDtos.PromoteResult res = service.promoteToBacklog(100L,
                new OpsDtos.PromoteRequest(9L, "STORY", "개발: 현장 오류", null), 99L);

        assertThat(res.originId()).isEqualTo(100L);
        assertThat(res.promoted().id()).isEqualTo(200L);
        // 원본(100)↔신규(200) RELATES_TO 양방향
        verify(linkMapper).insert(100L, 200L, "RELATES_TO");
        verify(linkMapper).insert(200L, 100L, "RELATES_TO");
        // 신규 항목은 대상 프로젝트(9)에 STORY로 생성
        verify(workItemService).create(argThat(r ->
                r.projectId().equals(9L) && r.issueType().equals("STORY")), eq(99L));
    }

    private WorkItemDtos.Response stubResponse(Long id) {
        return WorkItemDtos.Response.from(WorkItem.builder()
                .id(id).key("ZGOH-" + id).projectId(9L).issueType("STORY")
                .title("개발: 현장 오류").commonStatus("TODO").priority("HIGH").build());
    }
}
