package com.therecommerce.workmap.board.dto;

import com.therecommerce.workmap.workitem.dto.WorkItemDtos;

import java.util.List;

/** 보드 API DTO(T3-2 G. 보드 / WMP-AGL-005·OPS-001). 워크플로 상태별 컬럼+카드. */
public final class BoardDtos {

    private BoardDtos() {}

    public record BoardResponse(
            Long projectId,
            Long workflowId,
            Long sprintId,           // 스크럼 보드면 ACTIVE 스프린트 id, 운영 칸반이면 null
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
