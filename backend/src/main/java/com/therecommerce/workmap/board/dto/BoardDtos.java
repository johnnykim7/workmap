package com.therecommerce.workmap.board.dto;

import com.therecommerce.workmap.workitem.dto.WorkItemDtos;

import java.time.LocalDate;
import java.util.List;

/** 보드 API DTO(T3-2 G. 보드 / WMP-AGL-005·OPS-001). 병렬 스프린트별 그룹 × 상태 컬럼(CR-039). */
public final class BoardDtos {

    private BoardDtos() {}

    /**
     * 보드 응답(CR-039). ACTIVE 스프린트마다 그룹 1개(아코디언 섹션).
     * ACTIVE 0개(운영형/스크럼 미시작)면 sprintId=null 그룹 1개(백로그 제외 전체).
     */
    public record BoardResponse(
            Long projectId,
            Long workflowId,
            List<SprintGroup> groups
    ) {}

    /** 스프린트 1개 = 아코디언 섹션 1개. sprintId=null이면 운영형 단일 섹션(스프린트 없음). */
    public record SprintGroup(
            Long sprintId,           // null = 운영형/스크럼 미시작(스프린트 없는 단일 섹션)
            String sprintName,       // null = 스프린트 없음
            LocalDate startDate,
            LocalDate endDate,
            List<Column> columns
    ) {}

    /** 워크플로 상태 1개 = 보드 컬럼 1개(sort_order 순). */
    public record Column(
            Long statusId,
            String code,
            String label,
            String commonStatus,
            boolean isDone,
            boolean isApproval,
            List<WorkItemDtos.Response> cards
    ) {}
}
