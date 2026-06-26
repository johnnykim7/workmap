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

        // 카드 소스 결정
        Sprint active = sprintMapper.findActiveByProject(projectId);
        List<WorkItem> items;
        Long sprintId;
        if (active != null) {
            sprintId = active.getId();
            items = workItemMapper.findBySprint(sprintId);
        } else {
            sprintId = null;
            // 백로그(sprint_id=null) 제외한 전체 — 운영형: 모두 백로그 null일 수 있으므로 전체 포함
            items = workItemMapper.findByProjectAndSprint(projectId, null, true);
            // 운영형(스프린트 미사용)에서는 백로그=전체 항목이 곧 보드 카드
        }

        // 상태별 카드 버킷(컬럼 순서 보존)
        List<WorkflowStatus> statuses = workflowMapper.findStatuses(project.getWorkflowId());
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

        List<BoardDtos.Column> columns = statuses.stream()
                .map(st -> new BoardDtos.Column(
                        st.getId(), st.getCode(), st.getLabel(), st.getCommonStatus(),
                        st.isDone(), st.isApproval(), byStatus.get(st.getId())))
                .toList();

        return new BoardDtos.BoardResponse(projectId, project.getWorkflowId(), sprintId, columns);
    }
}
