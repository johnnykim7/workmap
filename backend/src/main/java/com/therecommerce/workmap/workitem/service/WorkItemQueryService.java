package com.therecommerce.workmap.workitem.service;

import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemSearchCriteria;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 통합 목록 조회 서비스(Sprint 4, WMP-VIEW-001·004). 필터+정렬+페이징(LST-1/2/3) +
 * 가시성(LST-4, BIZ-108): 사용자가 볼 수 있는 프로젝트의 work_item만 노출.
 *
 * <p>정렬 컬럼은 SQL 인젝션 방지를 위해 화이트리스트로만 매핑한다(${} 주입).
 */
@Service
@RequiredArgsConstructor
public class WorkItemQueryService {

    private final WorkItemMapper workItemMapper;
    private final ProjectMapper projectMapper;

    /** 정렬 허용 컬럼 화이트리스트(요청 키 → 실제 컬럼). */
    private static final Map<String, String> SORT_COLUMNS = Map.of(
            "createdAt", "created_at",
            "dueDate", "due_date",
            "priority", "priority",
            "statusChangedAt", "status_changed_at",
            "updatedAt", "updated_at"
    );
    private static final Set<String> SORT_DIRECTIONS = Set.of("ASC", "DESC");

    @Transactional(readOnly = true)
    public PageResponse<WorkItemDtos.Response> search(
            WorkItemDtos.SearchParams params, PageRequest page, Long viewerId) {

        // 가시성(BIZ-108) + WS 격리/선택(BIZ-112, CR-018): viewer가 볼 수 있는 프로젝트 id.
        // workspaceId 지정 시 그 WS로 좁힘(findVisible이 WS 멤버십도 강제하므로 비멤버 WS는 0건).
        List<Long> visibleProjectIds = projectMapper
                .findVisible(viewerId, params.workspaceId(), null, null, true)
                .stream().map(Project::getId).toList();

        // 특정 프로젝트 지정 시 가시 목록에 포함되는지 확인(미포함이면 결과 0건)
        Long projectId = params.projectId();
        if (projectId != null && !visibleProjectIds.contains(projectId)) {
            return PageResponse.of(List.of(), 0L, page);
        }

        // Map.of()는 null 키를 허용하지 않아 getOrDefault(null,..)이 NPE → sort null 먼저 방어
        String sortColumn = params.sort() == null
                ? "created_at" : SORT_COLUMNS.getOrDefault(params.sort(), "created_at");
        String sortDirection = params.direction() != null
                && SORT_DIRECTIONS.contains(params.direction().toUpperCase())
                ? params.direction().toUpperCase() : "DESC";

        WorkItemSearchCriteria c = WorkItemSearchCriteria.builder()
                .projectId(projectId)
                .visibleProjectIds(visibleProjectIds)
                .issueType(params.issueType())
                .commonStatus(params.commonStatus())
                .priority(params.priority())
                .assigneeId(params.assigneeId())
                .sprintId(params.sprintId())
                .epicId(params.epicId())
                .label(params.label())
                .flagged(params.flagged())
                .keyword(params.keyword())
                .sortColumn(sortColumn)
                .sortDirection(sortDirection)
                .limit(page.getPageSize())
                .offset(page.getOffset())
                .build();

        List<WorkItemDtos.Response> items = workItemMapper.search(c).stream()
                .map(WorkItemDtos.Response::from)
                .toList();
        long total = workItemMapper.countSearch(c);
        return PageResponse.of(items, total, page);
    }
}
