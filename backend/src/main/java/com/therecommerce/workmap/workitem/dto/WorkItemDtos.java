package com.therecommerce.workmap.workitem.dto;

import com.therecommerce.workmap.workitem.domain.AcceptanceCriterion;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * 업무 항목 요청/응답 DTO (T3-2 F). 단일 테이블이라 유형 고유 필드도 같은 DTO에 두고
 * 서비스/화면에서 표시 차등(BIZ-102). 상태/측정/담당자/유형전환은 전용 PATCH로 분리.
 */
public final class WorkItemDtos {

    private WorkItemDtos() {}

    /** 만들기 모달/인라인 생성(WMP-WI-001). status_id 입력은 무시 — 시작 상태 고정(WI-3). */
    public record CreateRequest(
            @NotNull Long projectId,
            @NotBlank String issueType,
            Long parentId,
            Long epicId,
            @NotBlank @Size(max = 300) String title,
            String description,
            String priority,
            Long assigneeId,
            Long reporterId,
            Long sprintId,
            Integer storyPoints,
            BigDecimal estimateHours,
            LocalDate startDate,
            LocalDate dueDate,
            Long measureUnitId,
            BigDecimal targetValue,
            BigDecimal currentValue,
            List<String> acceptanceCriteria,
            List<String> stepsToReproduce,
            String expectedResult,
            String actualResult,
            String environment,
            String severity,
            String checklist,
            List<String> labels,
            List<String> relatedSolutions
    ) {}

    /** 하위 작업 생성(WMP-WI-005) — 부모 id는 경로에서 주입. */
    public record CreateSubtaskRequest(
            @NotBlank @Size(max = 300) String title,
            String description,
            String priority,
            Long assigneeId,
            LocalDate startDate,
            LocalDate dueDate
    ) {}

    /** 인라인 필드 수정(WMP-WI-002/008). 전달된 값으로 덮어쓴다(부분 갱신은 서비스에서 머지). */
    public record UpdateRequest(
            String title,
            String description,
            String priority,
            Long epicId,
            Integer storyPoints,
            BigDecimal estimateHours,
            LocalDate startDate,
            LocalDate dueDate,
            List<String> acceptanceCriteria,
            List<String> stepsToReproduce,
            String expectedResult,
            String actualResult,
            String environment,
            String severity,
            String checklist,
            List<String> labels,
            List<String> relatedSolutions
    ) {}

    /** 상태 전이(WMP-WI-007). toStatusId 필수. 막힘은 상태 전이가 아님(CR-040) — flag 토글로 분리. */
    public record ChangeStatusRequest(
            @NotNull Long toStatusId
    ) {}

    /**
     * 막힘 깃발 토글(WMP-WI-007, CR-040 — Jira Flag 방식). 상태(status_id/common_status) 불변.
     * flagged=true면 reason(=block_reason) 필수(BIZ-005), false면 즉시 해제(사유도 제거).
     */
    public record FlagRequest(
            @NotNull Boolean flagged,
            String reason
    ) {}

    /** 담당자/보고자 지정·변경(WMP-WI-006). null=미배정(BIZ-002). */
    public record ChangeAssigneeRequest(
            Long assigneeId,
            Long reporterId
    ) {}

    /** 유형 전환(WMP-WI-014). 전환 후 계층 정합성 재검증(BIZ-103). */
    public record ConvertRequest(
            @NotBlank String issueType,
            Long parentId,
            Long epicId
    ) {}

    /** 측정(WMP-WI-016). progress는 서버에서 자동 계산(BIZ-105). */
    public record MeasureRequest(
            Long measureUnitId,
            BigDecimal targetValue,
            BigDecimal currentValue
    ) {}

    /** 스프린트 담기/빼기(WMP-AGL-002, SPR-5). null=백로그. */
    public record ChangeSprintRequest(
            Long sprintId
    ) {}

    /**
     * 벌크 편집(WMP-WI-015). 다건 일괄 변경. 전달된(non-null) 필드만 적용.
     * toStatusId는 항목별 FSM 검증(BLK-1) — 실패 항목은 분리 보고(BLK-2, 전체 롤백 아님).
     */
    public record BulkRequest(
            @NotNull List<Long> ids,
            Long toStatusId,         // 상태 일괄 변경(FSM 검증)
            Boolean changeAssignee,  // true면 assigneeId 적용(null=미배정)
            Long assigneeId,
            Long sprintId,           // 스프린트 일괄 변경
            Boolean changeSprint,    // true면 sprintId 적용(null=백로그)
            String priority,         // 우선순위 일괄 변경
            List<String> labels      // 라벨 일괄 변경
    ) {}

    /** 벌크 편집 결과(성공/실패 분리 보고, BLK-2). */
    public record BulkResult(
            List<Long> succeeded,
            List<BulkFailure> failed
    ) {}

    public record BulkFailure(
            Long id,
            String reason
    ) {}

    /**
     * 통합 목록(GET /work-items, WMP-VIEW-001) 쿼리 파라미터. 모두 선택.
     * sort 키: createdAt/dueDate/priority/statusChangedAt/updatedAt(화이트리스트). direction: ASC/DESC.
     */
    public record SearchParams(
            Long projectId,
            Long workspaceId,   // CR-018: 선택 WS로 좁힘(없으면 내 WS 전체 — BIZ-112 격리는 항상 적용)
            String issueType,
            String commonStatus,
            String priority,
            Long assigneeId,
            Long sprintId,
            Long epicId,
            String label,
            Boolean flagged,    // CR-040: 막힘 깃발 필터(막힌 것 퀵필터). true면 flagged=true만
            String keyword,
            String sort,
            String direction
    ) {}

    public record Response(
            Long id,
            String key,
            Long projectId,
            String issueType,
            Long parentId,
            Long epicId,
            String title,
            String description,
            Long workflowId,
            Long statusId,
            String commonStatus,
            String priority,
            Long assigneeId,
            Long reporterId,
            Long sprintId,
            Integer storyPoints,
            BigDecimal estimateHours,
            LocalDate startDate,
            LocalDate dueDate,
            int progress,
            boolean flagged,
            String blockReason,
            Long measureUnitId,
            BigDecimal targetValue,
            BigDecimal currentValue,
            List<AcceptanceCriterion> acceptanceCriteria,
            List<String> stepsToReproduce,
            String expectedResult,
            String actualResult,
            String environment,
            String severity,
            String checklist,
            List<String> labels,
            List<String> relatedSolutions,
            OffsetDateTime completedAt,
            String resultContent,
            Long resultWrittenBy,
            OffsetDateTime resultWrittenAt,
            Long createdBy,
            OffsetDateTime createdAt
    ) {
        public static Response from(WorkItem w) {
            return new Response(
                    w.getId(), w.getKey(), w.getProjectId(), w.getIssueType(), w.getParentId(),
                    w.getEpicId(), w.getTitle(), w.getDescription(), w.getWorkflowId(), w.getStatusId(),
                    w.getCommonStatus(), w.getPriority(), w.getAssigneeId(), w.getReporterId(),
                    w.getSprintId(), w.getStoryPoints(), w.getEstimateHours(), w.getStartDate(),
                    w.getDueDate(), w.getProgress(), w.isFlagged(), w.getBlockReason(), w.getMeasureUnitId(),
                    w.getTargetValue(), w.getCurrentValue(), w.getAcceptanceCriteria(),
                    w.getStepsToReproduce(), w.getExpectedResult(), w.getActualResult(),
                    w.getEnvironment(), w.getSeverity(), w.getChecklist(), w.getLabels(),
                    w.getRelatedSolutions(), w.getCompletedAt(),
                    w.getResultContent(), w.getResultWrittenBy(), w.getResultWrittenAt(),
                    w.getCreatedBy(), w.getCreatedAt());
        }
    }

    /** 결과(완료 산출물) 본문 저장·수정(WMP-WI-017, CR-048). 첨부는 기존 첨부 API 재사용. */
    public record ResultRequest(
            String resultContent
    ) {}

    /**
     * 인수조건 체크/편집(WMP-WI-018, CR-049). 전체 배열 치환(부분 패치 아님).
     * checkedBy/checkedAt은 서버가 채운다(입력 무시) — {text, checked}만 신뢰.
     */
    public record AcceptanceCriteriaRequest(
            @NotNull List<AcceptanceItem> criteria
    ) {
        public record AcceptanceItem(
                @NotNull String text,
                boolean checked
        ) {}
    }
}
