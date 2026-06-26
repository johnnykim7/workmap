package com.therecommerce.workmap.agile.dto;

import com.therecommerce.workmap.agile.domain.Sprint;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/** 스프린트 API DTO(T3-2 G. 애자일). */
public final class SprintDtos {

    private SprintDtos() {}

    /** 스프린트 생성(WMP-AGL-001) — 생성 시 status=FUTURE 고정. */
    public record CreateRequest(
            @NotBlank String name,
            String goal,
            LocalDate startDate,
            LocalDate endDate
    ) {}

    /** 스프린트 시작(WMP-AGL-003) — 기간 입력 시 고정, 없으면 생성 시 기간 사용. */
    public record StartRequest(
            LocalDate startDate,
            LocalDate endDate
    ) {}

    /**
     * 스프린트 완료(WMP-AGL-004). 미완료 항목 이월 대상:
     * carryToSprintId 가 지정되면 그 스프린트로, null 이면 백로그(sprint_id=null)로.
     */
    public record CompleteRequest(
            Long carryToSprintId
    ) {}

    public record Response(
            Long id,
            Long projectId,
            String name,
            String goal,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            Integer sortOrder,
            OffsetDateTime startedAt,
            OffsetDateTime completedAt
    ) {
        public static Response from(Sprint s) {
            return new Response(s.getId(), s.getProjectId(), s.getName(), s.getGoal(),
                    s.getStatus(), s.getStartDate(), s.getEndDate(), s.getSortOrder(),
                    s.getStartedAt(), s.getCompletedAt());
        }
    }

    /** 스프린트 완료 결과 요약(완료/이월 건수). */
    public record CompleteResult(
            Long sprintId,
            int doneCount,
            int carriedOverCount,
            Long carriedToSprintId
    ) {}

    /** 백로그 화면(WMP-AGL-001): 스프린트들 + 백로그 영역. */
    public record BacklogResponse(
            Long projectId,
            List<BacklogSection> sprints,
            BacklogSection backlog
    ) {}

    /** 백로그 한 구역(스프린트 또는 백로그). itemCount/storyPointsSum 헤더 카운트 포함. */
    public record BacklogSection(
            Sprint sprint,                 // 백로그 구역이면 null
            List<com.therecommerce.workmap.workitem.dto.WorkItemDtos.Response> items,
            int itemCount,
            int storyPointsSum
    ) {}
}
