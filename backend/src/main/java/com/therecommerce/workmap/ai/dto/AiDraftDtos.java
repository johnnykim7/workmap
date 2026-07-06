package com.therecommerce.workmap.ai.dto;

import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * AI 업무 초안(WMP-WI-019, CR-050) API DTO.
 * WorkMap → aimbase 워크플로 run 결과(구조적 JSON)를 파싱해 draft work_item으로 생성한다.
 */
public final class AiDraftDtos {

    private AiDraftDtos() {}

    /** 초안 생성 모드. epic=Epic 초안 / story-task=지정 Epic 하위 Story·Task 초안. */
    public enum Mode { epic, story_task }

    /** 초안 생성 요청. mode=story-task일 때 epicId 필수(그 Epic 하위로 생성). */
    public record CreateRequest(
            @NotBlank String statement,
            @NotNull Mode mode,
            Long epicId
    ) {}

    /** 초안 생성 결과 — 생성된 draft 요약 + 실패 건수(부분 실패 시 성공분만 반환). */
    public record CreateResult(
            List<WorkItemDtos.Response> created,
            int failedCount
    ) {}

    /** 초안 확정 요청. ids 비었으면(또는 null) 프로젝트 전체 draft 확정. */
    public record ConfirmRequest(
            List<Long> ids
    ) {}

    /** 확정/버리기 결과 — 영향 건수. */
    public record CountResult(
            int count
    ) {}

    // ---- aimbase 워크플로 응답 파싱 구조(§T3-2 F4 계약) ----

    /** mode=epic 응답: { "epics": [{summary, description}] }. */
    public record EpicPlan(String summary, String description) {}

    /** mode=story-task 응답: { "stories": [{summary, description, tasks:[{summary, description}]}] }. */
    public record StoryPlan(String summary, String description, List<TaskPlan> tasks) {}

    public record TaskPlan(String summary, String description) {}
}
