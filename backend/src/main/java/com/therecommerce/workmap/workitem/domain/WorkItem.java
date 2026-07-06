package com.therecommerce.workmap.workitem.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * work_items 단일 테이블 도메인 (T3-1, BIZ-106) — Epic/Story/Task/Bug/Sub-task를
 * issue_type + parent_id/epic_id 로 표현. 유형 고유 필드는 같은 테이블에 두고 화면 표시만 차등(BIZ-102).
 *
 * <p>상태는 workflow_status 참조(POL-001). common_status는 집계용 비정규화이며 상태 변경 시 동기화한다.
 * flagged는 Jira식 막힘 깃발(상태와 독립, block_reason=사유; CR-040). 측정 추상화(measure_unit/target/current)로
 * progress 자동 계산(BIZ-105).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkItem {

    private Long id;
    private String key;
    private Long projectId;
    private String issueType;
    private Long parentId;
    private Long epicId;
    private String title;
    private String description;
    private Long workflowId;
    private Long statusId;
    private String commonStatus;
    private String priority;
    private Long assigneeId;
    private Long reporterId;
    private Long sprintId;
    private Integer storyPoints;
    private BigDecimal estimateHours;
    private BigDecimal spentHours;
    private LocalDate startDate;
    private LocalDate dueDate;
    private int progress;
    private boolean flagged;
    private String blockReason;
    private Long measureUnitId;
    private BigDecimal targetValue;
    private BigDecimal currentValue;
    private List<AcceptanceCriterion> acceptanceCriteria;   // [{text,checked,checkedBy,checkedAt}] (CR-049, BIZ-115)
    private List<String> stepsToReproduce;
    private String expectedResult;
    private String actualResult;
    private String environment;
    private String severity;
    private String checklist;            // [{text,done}] — JSONB 원본 패스스루
    private List<String> labels;
    private List<String> relatedSolutions;
    private String opsApplyStatus;
    private OffsetDateTime statusChangedAt;
    private OffsetDateTime completedAt;
    private String resultContent;              // 결과(완료 산출물) 본문 — 리치텍스트 HTML (WMP-WI-017, CR-048)
    private Long resultWrittenBy;              // 결과 작성자 → users.id
    private OffsetDateTime resultWrittenAt;    // 결과 최종 작성 시각
    private boolean draft;                     // AI 업무 초안 여부 — true면 백로그에서만 구분표시, 그 외 격리(WMP-WI-019, BIZ-117, CR-050)
    private OffsetDateTime deletedAt;
    private Long createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
