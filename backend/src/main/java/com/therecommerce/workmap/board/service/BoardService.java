package com.therecommerce.workmap.board.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.agile.domain.Sprint;
import com.therecommerce.workmap.agile.mapper.SprintMapper;
import com.therecommerce.workmap.board.dto.BoardDtos;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workflow.domain.WorkflowStatus;
import com.therecommerce.workmap.workflow.mapper.WorkflowMapper;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 보드 서비스(Sprint 4, WMP-AGL-005·OPS-001). 워크플로 상태(sort_order)별 컬럼 + 카드 목록(BRD-1).
 *
 * <p>카드 소스:
 * <ul>
 *   <li>ACTIVE 스프린트가 있으면 그 스프린트 항목(스크럼 보드).</li>
 *   <li>없으면 백로그 제외 프로젝트 전체(운영형 칸반은 스프린트 미사용).</li>
 * </ul>
 * 카드 status 변경은 보드가 직접 하지 않고 WMP-WI-007(FSM 가드)를 호출한다(BRD-2, 직접 UPDATE 금지).
 */
@Service
@RequiredArgsConstructor
public class BoardService {

    private final ProjectMapper projectMapper;
    private final WorkflowMapper workflowMapper;
    private final SprintMapper sprintMapper;
    private final WorkItemMapper workItemMapper;

    @Transactional(readOnly = true)
    public BoardDtos.BoardResponse board(Long projectId) {
        Project project = projectMapper.findById(projectId);
        if (project == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        if (project.getWorkflowId() == null) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "프로젝트에 워크플로가 설정되어 있지 않습니다.");
        }

        List<WorkflowStatus> statuses = workflowMapper.findStatuses(project.getWorkflowId());

        // CR-039: ACTIVE 스프린트마다 그룹 1개(아코디언 섹션). 없으면 운영형 단일 그룹(sprintId=null).
        List<Sprint> actives = sprintMapper.findAllActiveByProject(projectId);
        List<BoardDtos.SprintGroup> groups = new ArrayList<>();
        if (actives.isEmpty()) {
            // 운영형/스크럼 미시작: 백로그(sprint_id=null) 제외 전체가 보드 카드
            List<WorkItem> items = workItemMapper.findByProjectAndSprint(projectId, null, true);
            groups.add(new BoardDtos.SprintGroup(null, null, null, null, columnsOf(statuses, items)));
        } else {
            for (Sprint s : actives) {
                List<WorkItem> items = workItemMapper.findBySprint(s.getId());
                groups.add(new BoardDtos.SprintGroup(
                        s.getId(), s.getName(), s.getStartDate(), s.getEndDate(),
                        columnsOf(statuses, items)));
            }
        }

        return new BoardDtos.BoardResponse(projectId, project.getWorkflowId(), groups);
    }

    /** 항목을 워크플로 상태(sort_order)별 컬럼으로 버킷팅(컬럼 순서 보존). */
    private List<BoardDtos.Column> columnsOf(List<WorkflowStatus> statuses, List<WorkItem> items) {
        Map<Long, List<WorkItemDtos.Response>> byStatus = new LinkedHashMap<>();
        for (WorkflowStatus st : statuses) {
            byStatus.put(st.getId(), new ArrayList<>());
        }
        for (WorkItem w : items) {
            List<WorkItemDtos.Response> bucket = byStatus.get(w.getStatusId());
            if (bucket != null) {
                bucket.add(WorkItemDtos.Response.from(w));
            }
        }
        return statuses.stream()
                .map(st -> new BoardDtos.Column(
                        st.getId(), st.getCode(), st.getLabel(), st.getCommonStatus(),
                        st.isDone(), st.isApproval(), byStatus.get(st.getId())))
                .toList();
    }
}
