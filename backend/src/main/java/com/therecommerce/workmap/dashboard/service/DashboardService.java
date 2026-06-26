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
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 회사홈/보고 서비스 (T3-2 G, WMP-HOME-001~003).
 *
 * <p>가시성(BIZ-108): 막힘/지연/미배정 목록과 지표는 viewer가 볼 수 있는 프로젝트로 한정한다
 * (ProjectMapper.findVisible). projectId 지정 시 가시 목록에 포함될 때만 그 프로젝트로 좁힌다.
 * 지연=POL-002(due_date &lt; today, 제외 {DONE,HOLD}), 정체=POL-003(status_changed_at, 기본 7일).
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DashboardMapper dashboardMapper;
    private final ProjectMapper projectMapper;

    /** 장기 미변경(정체) 기준 일수(POL-003). delay/stale 설정으로 조정. 기본 7. */
    @Value("${workmap.stale.threshold-days:7}")
    private int staleDays;

    private List<Long> visibleProjectIds(Long viewerId) {
        return projectMapper.findVisible(viewerId, null, null, null, true)
                .stream().map(Project::getId).toList();
    }

    /** mode = BLOCKED | DELAYED | UNASSIGNED 목록. projectId 미가시면 결과 0건. */
    @Transactional(readOnly = true)
    public PageResponse<WorkItemDtos.Response> list(String mode, Long projectId,
                                                    PageRequest page, Long viewerId) {
        List<Long> visible = visibleProjectIds(viewerId);
        if (projectId != null && !visible.contains(projectId)) {
            return PageResponse.of(List.of(), 0L, page);
        }
        List<WorkItem> rows = dashboardMapper.findByMode(
                mode, visible, projectId, staleDays, page.getPageSize(), page.getOffset());
        long total = dashboardMapper.countByMode(mode, visible, projectId, staleDays);
        List<WorkItemDtos.Response> items = rows.stream()
                .map(WorkItemDtos.Response::from)
                .toList();
        return PageResponse.of(items, total, page);
    }

    /** 지표 카드(WMP-HOME-001). projectId 미가시면 빈 지표(모두 0). */
    @Transactional(readOnly = true)
    public DashboardDtos.Metrics metrics(Long projectId, Long viewerId) {
        List<Long> visible = visibleProjectIds(viewerId);
        if (projectId != null && !visible.contains(projectId)) {
            return new DashboardDtos.Metrics();  // 모두 0
        }
        return dashboardMapper.metrics(visible, projectId, staleDays);
    }

    /** 프로젝트 보고서(WMP-HOME-003): 진행률/지연/막힘 + 분포(상태/유형/담당자). */
    @Transactional(readOnly = true)
    public DashboardDtos.Report report(Long projectId, Long viewerId) {
        Project project = projectMapper.findById(projectId);
        if (project == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        // 가시성(BIZ-108): viewer가 볼 수 없는 비공개 프로젝트면 차단
        boolean visible = visibleProjectIds(viewerId).contains(projectId);
        if (!visible) {
            throw new BusinessException(WmpErrorCode.NOT_PROJECT_MEMBER);
        }
        ProjectSummary summary = projectMapper.summarize(projectId);
        summary.setProgress(summary.getTotal() == 0
                ? 0 : (int) Math.round(100.0 * summary.getDone() / summary.getTotal()));
        return new DashboardDtos.Report(
                projectId,
                project.getName(),
                summary,
                dashboardMapper.distributionByStatus(projectId),
                dashboardMapper.distributionByType(projectId),
                dashboardMapper.distributionByAssignee(projectId));
    }
}
