package com.therecommerce.workmap.dashboard.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.dashboard.dto.DashboardDtos;
import com.therecommerce.workmap.dashboard.mapper.DashboardMapper;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.dto.ProjectSummary;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * DashboardService 단위테스트 (WMP-HOME-001~003): 가시성 필터(BIZ-108) / 미가시 프로젝트 차단 / 보고서.
 */
@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock DashboardMapper dashboardMapper;
    @Mock ProjectMapper projectMapper;
    DashboardService service;

    @BeforeEach
    void setUp() {
        service = new DashboardService(dashboardMapper, projectMapper);
        ReflectionTestUtils.setField(service, "staleDays", 7);
    }

    private void visible(Long... ids) {
        when(projectMapper.findVisible(eq(1L), any(), any(), any(), anyBoolean()))
                .thenReturn(java.util.Arrays.stream(ids)
                        .map(id -> Project.builder().id(id).build()).toList());
    }

    @Test
    @DisplayName("막힘목록_가시프로젝트만집계")
    void 막힘목록_가시필터() {
        visible(5L, 6L);
        when(dashboardMapper.findByMode(eq("BLOCKED"), anyList(), isNull(), eq(7), eq(20), eq(0)))
                .thenReturn(List.of(WorkItem.builder().id(1L).commonStatus("BLOCKED").build()));
        when(dashboardMapper.countByMode(eq("BLOCKED"), anyList(), isNull(), eq(7))).thenReturn(1L);

        PageResponse<WorkItemDtos.Response> res =
                service.list("BLOCKED", null, null, new PageRequest(0, 20), 1L);

        assertThat(res.getItems()).hasSize(1);
        assertThat(res.getTotalCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("프로젝트지정_미가시면_빈결과")
    void 미가시프로젝트_빈결과() {
        visible(5L, 6L);   // 99는 가시 목록에 없음

        PageResponse<WorkItemDtos.Response> res =
                service.list("DELAYED", 99L, null, new PageRequest(0, 20), 1L);

        assertThat(res.getItems()).isEmpty();
        assertThat(res.getTotalCount()).isZero();
        verify(dashboardMapper, never()).findByMode(any(), any(), any(), anyInt(), anyInt(), anyInt());
    }

    @Test
    @DisplayName("지표_미가시프로젝트_모두0")
    void 지표_미가시_제로() {
        visible(5L);

        DashboardDtos.Metrics m = service.metrics(99L, null, 1L);

        assertThat(m.getInProgress()).isZero();
        assertThat(m.getStale()).isZero();
        verify(dashboardMapper, never()).metrics(any(), any(), anyInt());
    }

    @Test
    @DisplayName("보고서_없는프로젝트_NOT_FOUND")
    void 보고서_없음_거부() {
        when(projectMapper.findById(404L)).thenReturn(null);

        assertThatThrownBy(() -> service.report(404L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.PROJECT_NOT_FOUND);
    }

    @Test
    @DisplayName("보고서_미가시프로젝트_차단")
    void 보고서_미가시_차단() {
        when(projectMapper.findById(7L)).thenReturn(Project.builder().id(7L).build());
        visible(5L);   // 7은 미가시

        assertThatThrownBy(() -> service.report(7L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.NOT_PROJECT_MEMBER);
    }

    @Test
    @DisplayName("보고서_진행률_총건수0이면0")
    void 보고서_진행률계산() {
        when(projectMapper.findById(5L)).thenReturn(Project.builder().id(5L).name("P5").build());
        visible(5L);
        ProjectSummary summary = new ProjectSummary();
        summary.setTotal(4);
        summary.setDone(1);
        when(projectMapper.summarize(5L)).thenReturn(summary);
        when(dashboardMapper.distributionByStatus(5L)).thenReturn(List.of());
        when(dashboardMapper.distributionByType(5L)).thenReturn(List.of());
        when(dashboardMapper.distributionByAssignee(5L)).thenReturn(List.of());

        DashboardDtos.Report report = service.report(5L, 1L);

        assertThat(report.projectName()).isEqualTo("P5");
        assertThat(report.summary().getProgress()).isEqualTo(25);  // 1/4
    }
}
