package com.therecommerce.workmap.workitem.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.approval.service.ApprovalGate;
import com.therecommerce.workmap.common.event.WorkItemEvents;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.measure.domain.MeasureUnit;
import com.therecommerce.workmap.measure.mapper.MeasureUnitMapper;
import com.therecommerce.workmap.member.mapper.ProjectMemberMapper;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.domain.Visibility;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workitem.domain.AcceptanceCriterion;
import com.therecommerce.workmap.workitem.domain.ActivityLog;
import com.therecommerce.workmap.workitem.domain.CommonStatus;
import com.therecommerce.workmap.workitem.domain.IssueType;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.ActivityLogMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import com.therecommerce.workmap.workflow.domain.WorkflowStatus;
import com.therecommerce.workmap.workflow.mapper.WorkflowMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * 업무 항목 코어 서비스 (Sprint 3). work_item 단일 테이블 CRUD + 계층 정합성(BIZ-103) +
 * FSM 가드(BIZ-010, 화이트리스트) + BLOCKED 사유(BIZ-005) + 완료 자동(BIZ-006) +
 * 담당자 미배정 허용(BIZ-002) + 측정 progress(BIZ-105) + 유형 전환(WMP-WI-014).
 *
 * <p>상태 변경은 반드시 {@link #changeStatus}를 경유한다(직접 status UPDATE 금지, FSM-13).
 * 활동로그·진행률 재집계는 동일 트랜잭션, 알림 유발 이벤트는 AFTER_COMMIT 비동기 리스너로 분리(T1-6).
 */
@Service
@RequiredArgsConstructor
public class WorkItemService {

    private final WorkItemMapper workItemMapper;
    private final WorkflowMapper workflowMapper;
    private final ProjectMapper projectMapper;
    private final ProjectMemberMapper memberMapper;
    private final MeasureUnitMapper measureUnitMapper;
    private final ActivityLogMapper activityLogMapper;
    private final ApprovalGate approvalGate;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    // ===================================================================
    // 생성 / 조회 / 수정 / 삭제
    // ===================================================================

    @Transactional
    public WorkItemDtos.Response create(WorkItemDtos.CreateRequest req, Long actorId) {
        return create(req, actorId, false);
    }

    /**
     * 업무 생성. draft=true면 AI 초안(WMP-WI-019, CR-050)으로 만들어 백로그에서만 구분표시되고
     * 그 외 조회/집계에서 격리(BIZ-117)한다. 만들기 모달/인라인/하위작업 경로는 draft=false.
     */
    @Transactional
    public WorkItemDtos.Response create(WorkItemDtos.CreateRequest req, Long actorId, boolean draft) {
        if (req.projectId() == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_REQUIRED);  // WI-1, BIZ-001
        }
        Project project = projectMapper.findById(req.projectId());
        if (project == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        if (project.getWorkflowId() == null) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "프로젝트에 워크플로가 설정되어 있지 않습니다.");
        }

        IssueType type = parseIssueType(req.issueType());
        validateHierarchy(type, req.parentId(), null);                  // HRC-1/2/3 (생성)

        // 담당자 지정 시 멤버 검증(BIZ-108) — 비공개 프로젝트는 멤버만 담당자/멘션 가능
        if (req.assigneeId() != null) {
            assertProjectMember(project, req.assigneeId());
        }
        // BIZ-007: start_date > due_date 거부(WI-5)
        if (req.startDate() != null && req.dueDate() != null && req.startDate().isAfter(req.dueDate())) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "시작일이 종료일보다 늦을 수 없습니다.");
        }

        // 시작 상태로 고정(WI-3, BIZ-101) — status_id 입력은 받지 않는다
        WorkflowStatus start = workflowMapper.findStartStatus(project.getWorkflowId());
        if (start == null) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "워크플로 시작 상태가 정의되어 있지 않습니다.");
        }

        // key 채번(WI-4): projects.seq_counter += 1
        int seq = workItemMapper.nextSeq(project.getId());
        String key = project.getKey() + "-" + seq;

        WorkItem item = WorkItem.builder()
                .key(key)
                .projectId(project.getId())
                .issueType(type.name())
                .parentId(req.parentId())
                .epicId(req.epicId())
                .title(req.title())
                .description(req.description())
                .workflowId(project.getWorkflowId())
                .statusId(start.getId())
                .commonStatus(start.getCommonStatus())                 // 시작 상태 환산값(보통 TODO)
                .priority(req.priority() == null ? "NORMAL" : req.priority())
                .assigneeId(req.assigneeId())
                .reporterId(req.reporterId() == null ? actorId : req.reporterId())
                .sprintId(req.sprintId())
                .storyPoints(req.storyPoints())
                .estimateHours(req.estimateHours())
                .startDate(req.startDate())
                .dueDate(req.dueDate())
                .progress(0)
                .measureUnitId(req.measureUnitId())
                .targetValue(req.targetValue())
                .currentValue(req.currentValue())
                .acceptanceCriteria(wrapCriteria(req.acceptanceCriteria(), null))
                .stepsToReproduce(req.stepsToReproduce())
                .expectedResult(req.expectedResult())
                .actualResult(req.actualResult())
                .environment(req.environment())
                .severity(req.severity())
                .checklist(req.checklist())
                .labels(req.labels() == null ? List.of() : req.labels())
                .relatedSolutions(req.relatedSolutions() == null ? List.of() : req.relatedSolutions())
                .draft(draft)
                .createdBy(actorId)
                .build();

        // 생성 시 측정값이 있으면 progress 초기 계산(BIZ-105)
        item.setProgress(computeProgress(item, start));

        workItemMapper.insert(item);

        WorkItem saved = workItemMapper.findById(item.getId());

        // WorkItemCreated 발행(WI-7) — 활동로그/알림/상위 집계 소비
        events.publishEvent(new WorkItemEvents.WorkItemCreated(
                saved.getId(), saved.getProjectId(), saved.getIssueType(),
                saved.getParentId(), saved.getAssigneeId(), actorId, saved.getCreatedAt()));

        return WorkItemDtos.Response.from(saved);
    }

    @Transactional
    public WorkItemDtos.Response createSubtask(Long parentId, WorkItemDtos.CreateSubtaskRequest req, Long actorId) {
        WorkItem parent = getEntity(parentId);
        // 부모 하위로 SUBTASK 생성(HRC-6)
        WorkItemDtos.CreateRequest sub = new WorkItemDtos.CreateRequest(
                parent.getProjectId(), IssueType.SUBTASK.name(), parentId, parent.getEpicId(),
                req.title(), req.description(), req.priority(), req.assigneeId(), null, parent.getSprintId(),
                null, null, req.startDate(), req.dueDate(),
                null, null, null, null, null, null, null, null, null, null, null, null);
        return create(sub, actorId);
    }

    @Transactional(readOnly = true)
    public WorkItem getEntity(Long id) {
        WorkItem w = workItemMapper.findById(id);
        if (w == null) {
            throw new BusinessException(WmpErrorCode.WORK_ITEM_NOT_FOUND);
        }
        return w;
    }

    @Transactional(readOnly = true)
    public WorkItemDtos.Response get(Long id) {
        return WorkItemDtos.Response.from(getEntity(id));
    }

    @Transactional
    public WorkItemDtos.Response update(Long id, WorkItemDtos.UpdateRequest req, Long actorId) {
        WorkItem w = getEntity(id);
        // 부분 갱신: 전달된(non-null) 값만 머지
        if (req.title() != null) w.setTitle(req.title());
        if (req.description() != null) w.setDescription(req.description());
        if (req.priority() != null) w.setPriority(req.priority());
        if (req.epicId() != null) w.setEpicId(req.epicId());
        if (req.storyPoints() != null) w.setStoryPoints(req.storyPoints());
        if (req.estimateHours() != null) w.setEstimateHours(req.estimateHours());
        if (req.startDate() != null) w.setStartDate(req.startDate());
        if (req.dueDate() != null) w.setDueDate(req.dueDate());
        // 인수조건 텍스트 편집(CR-049): 텍스트만 들어오므로, 같은 text의 기존 체크 상태는 보존한다.
        if (req.acceptanceCriteria() != null) {
            w.setAcceptanceCriteria(wrapCriteria(req.acceptanceCriteria(), w.getAcceptanceCriteria()));
        }
        if (req.stepsToReproduce() != null) w.setStepsToReproduce(req.stepsToReproduce());
        if (req.expectedResult() != null) w.setExpectedResult(req.expectedResult());
        if (req.actualResult() != null) w.setActualResult(req.actualResult());
        if (req.environment() != null) w.setEnvironment(req.environment());
        if (req.severity() != null) w.setSeverity(req.severity());
        if (req.checklist() != null) w.setChecklist(req.checklist());
        if (req.labels() != null) w.setLabels(req.labels());
        if (req.relatedSolutions() != null) w.setRelatedSolutions(req.relatedSolutions());

        if (w.getStartDate() != null && w.getDueDate() != null && w.getStartDate().isAfter(w.getDueDate())) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "시작일이 종료일보다 늦을 수 없습니다.");
        }
        workItemMapper.updateFields(w);
        log(id, actorId, ActivityLog.FIELD_UPDATE, null, null);
        return WorkItemDtos.Response.from(getEntity(id));
    }

    /**
     * 결과(완료 산출물) 본문 저장·수정(WMP-WI-017, BIZ-114, CR-048).
     * 업무당 1개·덮어쓰기. 작성자=호출자, 작성시각=now. DONE 전제조건이 아니므로 상태와 무관하게 저장 가능
     * (완료 노출은 화면 책임). 첨부는 별도 API(기존 첨부) 재사용이라 여기서 다루지 않는다.
     */
    @Transactional
    public WorkItemDtos.Response saveResult(Long id, WorkItemDtos.ResultRequest req, Long actorId) {
        WorkItem w = getEntity(id);
        w.setResultContent(req.resultContent());
        w.setResultWrittenBy(actorId);
        w.setResultWrittenAt(OffsetDateTime.now(clock));
        workItemMapper.updateResult(w);
        return WorkItemDtos.Response.from(getEntity(id));
    }

    /** 소프트 삭제(WI-6, BIZ-009). 자식(Sub-task)도 함께 deleted_at 설정. */
    @Transactional
    public void softDelete(Long id, Long actorId) {
        WorkItem w = getEntity(id);
        OffsetDateTime now = OffsetDateTime.now(clock);
        workItemMapper.softDeleteChildren(w.getId(), now);
        workItemMapper.softDelete(w.getId(), now);
    }

    // ===================================================================
    // 상태 전이 (FSM 가드) — BIZ-010 핵심
    // ===================================================================

    @Transactional
    public WorkItemDtos.Response changeStatus(Long id, WorkItemDtos.ChangeStatusRequest req, Long actorId) {
        return changeStatus(id, req, actorId, false);
    }

    /**
     * 상태 전이 핵심(FSM 가드 + 승인 게이트). {@code bypassApproval}=true는 승인 결과로 진행하는 경우
     * (ApprovalService가 APPROVE 후 호출) — 현재 게이트의 PENDING 차단을 우회한다(APR-4).
     */
    @Transactional
    public WorkItemDtos.Response changeStatus(Long id, WorkItemDtos.ChangeStatusRequest req,
                                              Long actorId, boolean bypassApproval) {
        WorkItem w = getEntity(id);
        WorkflowStatus from = workflowMapper.findStatusById(w.getStatusId());
        WorkflowStatus to = workflowMapper.findStatusById(req.toStatusId());
        if (to == null || !to.getWorkflowId().equals(w.getWorkflowId())) {
            throw new BusinessException(WmpErrorCode.TRANSITION_NOT_ALLOWED, "대상 상태가 이 워크플로에 없습니다.");
        }

        // 승인 게이트(BIZ-110): 현재 상태가 승인 게이트이고 PENDING 승인이 남아있으면 다음 상태 전이 차단(APR-2)
        approvalGate.assertCanLeave(from, w.getId(), bypassApproval);

        // 워크플로 화이트리스트 검증(FSM-1/2/9, BIZ-010). 막힘은 상태 전이가 아니므로(CR-040)
        // 여기서 다루지 않는다 — 막힘은 toggleFlag로만 켜고 끈다.
        boolean allowed = workflowMapper.transitionExists(w.getWorkflowId(), w.getStatusId(), to.getId());
        if (!allowed) {
            throw new BusinessException(WmpErrorCode.TRANSITION_NOT_ALLOWED,
                    "허용되지 않은 전이입니다: " + (from == null ? "?" : from.getCode()) + " → " + to.getCode());
        }

        String fromCode = from == null ? null : from.getCode();
        OffsetDateTime now = OffsetDateTime.now(clock);

        // 인수조건 완료 가드(CR-049, BIZ-116): DONE 계열 진입 시에만. 강제 프로젝트면 미충족 차단.
        // 비강제 프로젝트면 통과하되, 미충족인 채 완료되면 활동로그에 스냅샷을 남긴다(책임 소지).
        List<AcceptanceCriterion> unmet = to.isDone() ? unmetCriteria(w) : List.of();
        boolean unmetCompletion = false;
        if (to.isDone() && !unmet.isEmpty()) {
            Project project = projectMapper.findById(w.getProjectId());
            boolean enforce = project != null && Boolean.TRUE.equals(project.getRequireAcceptanceCriteria());
            if (enforce) {
                throw new BusinessException(WmpErrorCode.ACCEPTANCE_CRITERIA_UNMET,
                        "미충족한 인수조건이 " + unmet.size() + "건 있어 완료할 수 없습니다.");
            }
            unmetCompletion = true;   // 비강제 — 통과하되 아래에서 스냅샷 기록
        }

        // 완료 자동(BIZ-006): DONE 계열 진입 시 completed_at, 재오픈 시 null(FSM-6/7/8)
        if (to.isDone()) {
            w.setCompletedAt(now);
        } else {
            w.setCompletedAt(null);
        }

        // 착수 자동(Jira식): IN_PROGRESS 최초 진입 시 start_date가 비어있으면 오늘로 자동 설정
        if (CommonStatus.IN_PROGRESS.name().equals(to.getCommonStatus()) && w.getStartDate() == null) {
            w.setStartDate(now.toLocalDate());
        }

        w.setStatusId(to.getId());
        w.setCommonStatus(to.getCommonStatus());
        w.setStatusChangedAt(now);
        workItemMapper.updateStatus(w);

        // 활동로그(FSM-12) — 동일 트랜잭션
        log(id, actorId, ActivityLog.STATUS_CHANGE, fromCode, to.getCode());

        // 비강제 미충족 완료 스냅샷(CR-049, BIZ-116) — 누가·언제·어떤 항목이 미충족인 채 완료했나(책임 소지)
        if (unmetCompletion) {
            int total = w.getAcceptanceCriteria() == null ? 0 : w.getAcceptanceCriteria().size();
            log(id, actorId, ActivityLog.COMPLETE_WITH_UNMET, null, null,
                    unmetSnapshot(unmet, total - unmet.size(), total));
        }

        // 이벤트 발행(FSM-10/11)
        events.publishEvent(new WorkItemEvents.WorkItemStatusChanged(
                w.getId(), w.getIssueType(), fromCode, to.getCode(), actorId, now));

        // 승인 게이트 진입(APR-1/7): is_approval 상태에 도달하면 PENDING 승인 행 생성 + ApprovalRequested 발행
        approvalGate.onEnterGate(to, w.getId(), actorId, now);

        // 상위 Epic 진행률 재집계(AGG-1) — 동일 트랜잭션(파생값 정합)
        recomputeEpicProgress(w.getEpicId());

        return WorkItemDtos.Response.from(getEntity(id));
    }

    /**
     * 막힘 깃발 토글(WMP-WI-007, CR-040 — Jira Flag 방식). 상태(status_id/common_status) 불변.
     * flagged=true면 reason 필수(BIZ-005), false면 즉시 해제(사유 제거). 켤 때만 WorkItemBlocked 발행.
     */
    @Transactional
    public WorkItemDtos.Response toggleFlag(Long id, WorkItemDtos.FlagRequest req, Long actorId) {
        WorkItem w = getEntity(id);
        boolean on = Boolean.TRUE.equals(req.flagged());
        OffsetDateTime now = OffsetDateTime.now(clock);

        if (on) {
            if (req.reason() == null || req.reason().isBlank()) {
                throw new BusinessException(WmpErrorCode.BLOCK_REASON_REQUIRED);
            }
            w.setFlagged(true);
            w.setBlockReason(req.reason());
        } else {
            w.setFlagged(false);
            w.setBlockReason(null);
        }
        workItemMapper.updateFlag(w);

        // 활동로그(FSM-12) — 동일 트랜잭션
        log(id, actorId, on ? ActivityLog.FLAG_ON : ActivityLog.FLAG_OFF, null, req.reason());

        // 막힘 표시(ON) 시에만 알림 이벤트 발행 — 담당자/멘션 대상(CR-040: 상태 전이 대신 flag에서 발행)
        if (on) {
            events.publishEvent(new WorkItemEvents.WorkItemBlocked(
                    w.getId(), w.getIssueType(), req.reason(), actorId, now,
                    w.getAssigneeId(), List.of()));
        }

        return WorkItemDtos.Response.from(getEntity(id));
    }

    // ===================================================================
    // 담당자 / 측정 / 유형 전환 / 스프린트
    // ===================================================================

    @Transactional
    public WorkItemDtos.Response changeAssignee(Long id, WorkItemDtos.ChangeAssigneeRequest req, Long actorId) {
        WorkItem w = getEntity(id);
        Long previous = w.getAssigneeId();

        if (req.assigneeId() != null) {
            Project project = projectMapper.findById(w.getProjectId());
            assertProjectMember(project, req.assigneeId());            // ASG-2, BIZ-108
        }
        workItemMapper.updateAssignee(id, req.assigneeId(), req.reporterId());
        log(id, actorId, ActivityLog.ASSIGN,
                previous == null ? null : String.valueOf(previous),
                req.assigneeId() == null ? null : String.valueOf(req.assigneeId()));

        OffsetDateTime now = OffsetDateTime.now(clock);
        events.publishEvent(new WorkItemEvents.WorkItemAssigned(
                id, req.assigneeId(), previous, actorId, now));         // ASG-1
        return WorkItemDtos.Response.from(getEntity(id));
    }

    @Transactional
    public WorkItemDtos.Response updateMeasure(Long id, WorkItemDtos.MeasureRequest req, Long actorId) {
        WorkItem w = getEntity(id);
        BigDecimal previous = w.getCurrentValue();

        w.setMeasureUnitId(req.measureUnitId());
        w.setTargetValue(req.targetValue());
        w.setCurrentValue(req.currentValue());

        WorkflowStatus current = workflowMapper.findStatusById(w.getStatusId());
        int progress = computeProgress(w, current);
        w.setProgress(progress);
        workItemMapper.updateMeasure(w);                                // progress 동일 트랜잭션 재계산(MSR-3)

        String valueType = null;
        if (req.measureUnitId() != null) {
            MeasureUnit unit = measureUnitMapper.findById(req.measureUnitId());
            valueType = unit == null ? null : unit.getValueType();
        }
        OffsetDateTime now = OffsetDateTime.now(clock);
        events.publishEvent(new WorkItemEvents.MeasureUpdated(
                id, req.measureUnitId(), req.targetValue(), req.currentValue(),
                previous, valueType, actorId, now));

        recomputeEpicProgress(w.getEpicId());
        return WorkItemDtos.Response.from(getEntity(id));
    }

    /** 유형 전환(WMP-WI-014). 미사용 필드 보존(CVT-1), 전환 후 계층 재검증(CVT-2). */
    @Transactional
    public WorkItemDtos.Response convert(Long id, WorkItemDtos.ConvertRequest req, Long actorId) {
        WorkItem w = getEntity(id);
        String fromType = w.getIssueType();
        IssueType target = parseIssueType(req.issueType());

        Long newParent = req.parentId() != null ? req.parentId() : w.getParentId();
        validateHierarchy(target, newParent, id);                       // 전환 후 계층 정합성(BIZ-103)

        w.setIssueType(target.name());
        w.setParentId(target == IssueType.SUBTASK ? newParent : null);  // Sub-task 외 유형은 parent 비움
        w.setEpicId(req.epicId() != null ? req.epicId() : w.getEpicId());
        workItemMapper.updateType(w);

        log(id, actorId, ActivityLog.TYPE_CONVERT, fromType, target.name());  // CVT-3
        return WorkItemDtos.Response.from(getEntity(id));
    }

    /** 스프린트 담기/빼기(SPR-5) — 상태 전이 아님, FSM 미경유. */
    @Transactional
    public WorkItemDtos.Response changeSprint(Long id, Long sprintId, Long actorId) {
        getEntity(id);
        workItemMapper.updateSprint(id, sprintId);
        return WorkItemDtos.Response.from(getEntity(id));
    }

    // ===================================================================
    // 내부 헬퍼
    // ===================================================================

    /** 계층 정합성(BIZ-103): Sub-task 부모 필수 / Epic은 Sub-task 부모 불가 / depth≤2 / 순환 금지 /
     *  Sub-task 외 유형은 부모 불가(HRC-5). */
    private void validateHierarchy(IssueType type, Long parentId, Long selfId) {
        // HRC-5: Sub-task가 아닌 유형(EPIC/STORY/TASK/BUG/DOC)은 parent_id를 가질 수 없다.
        if (!type.requiresParent() && parentId != null) {
            throw new BusinessException(WmpErrorCode.HIERARCHY_VIOLATION,
                    "Sub-task가 아닌 유형은 부모 항목을 가질 수 없습니다.");  // HRC-5
        }
        if (type.requiresParent()) {
            if (parentId == null) {
                throw new BusinessException(WmpErrorCode.HIERARCHY_VIOLATION, "Sub-task는 부모 항목이 필수입니다.");  // HRC-1
            }
            WorkItem parent = workItemMapper.findById(parentId);
            if (parent == null) {
                throw new BusinessException(WmpErrorCode.HIERARCHY_VIOLATION, "부모 항목을 찾을 수 없습니다.");
            }
            IssueType parentType = IssueType.valueOf(parent.getIssueType());
            if (!parentType.canBeSubtaskParent()) {
                throw new BusinessException(WmpErrorCode.HIERARCHY_VIOLATION, "Epic/Sub-task는 Sub-task의 부모가 될 수 없습니다.");  // HRC-2
            }
            if (parentType.depth() + 1 > 2) {
                throw new BusinessException(WmpErrorCode.HIERARCHY_VIOLATION, "계층 깊이는 2를 초과할 수 없습니다.");  // HRC-3
            }
            // 순환 참조 금지(HRC-4): 부모가 자기 자손이면 거부
            if (selfId != null && (parentId.equals(selfId)
                    || workItemMapper.isDescendant(selfId, parentId))) {
                throw new BusinessException(WmpErrorCode.HIERARCHY_VIOLATION, "순환 참조는 허용되지 않습니다.");
            }
        }
    }

    /** progress 계산(BIZ-105): 정량 = 현재÷목표×100, 정성(BOOLEAN/SELECT) = 상태 기반. */
    private int computeProgress(WorkItem w, WorkflowStatus status) {
        boolean done = status != null && CommonStatus.DONE.name().equals(status.getCommonStatus());
        if (w.getMeasureUnitId() == null) {
            return done ? 100 : w.getProgress();  // 측정 없으면 상태 기반(완료=100) — AGG는 별도
        }
        MeasureUnit unit = measureUnitMapper.findById(w.getMeasureUnitId());
        String valueType = unit == null ? "NUMBER" : unit.getValueType();
        if ("NUMBER".equals(valueType)) {                                // 정량(MSR-1)
            if (w.getTargetValue() == null || w.getTargetValue().compareTo(BigDecimal.ZERO) == 0
                    || w.getCurrentValue() == null) {
                return 0;
            }
            int pct = w.getCurrentValue()
                    .divide(w.getTargetValue(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(0, RoundingMode.HALF_UP).intValue();
            return Math.max(0, Math.min(100, pct));
        }
        // 정성(BOOLEAN/SELECT) — 상태 기반(MSR-2): DONE이면 100, 아니면 0
        return done ? 100 : 0;
    }

    /** 상위 Epic 진행률 자동 집계(AGG-1, BIZ-008): 직속 자식 중 DONE 비율. */
    private void recomputeEpicProgress(Long epicId) {
        if (epicId == null) {
            return;
        }
        WorkItem epic = workItemMapper.findById(epicId);
        if (epic == null) {
            return;
        }
        List<WorkItem> children = workItemMapper.findByEpic(epicId);
        if (children.isEmpty()) {
            return;
        }
        long done = children.stream()
                .filter(c -> CommonStatus.DONE.name().equals(c.getCommonStatus()))
                .count();
        int progress = (int) Math.round(100.0 * done / children.size());
        workItemMapper.updateProgress(epicId, progress);
    }

    private void assertProjectMember(Project project, Long userId) {
        if (project == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        // 공개 프로젝트라도 담당자는 멤버 권장이나, 비공개는 멤버만 강제(BIZ-108)
        if (Visibility.PRIVATE.name().equals(project.getVisibility())) {
            boolean member = project.getCreatedBy().equals(userId)
                    || memberMapper.exists(project.getId(), userId);
            if (!member) {
                throw new BusinessException(WmpErrorCode.NOT_PROJECT_MEMBER, "비공개 프로젝트는 멤버만 담당자로 지정할 수 있습니다.");
            }
        }
    }

    private IssueType parseIssueType(String code) {
        try {
            return IssueType.valueOf(code);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "알 수 없는 업무 유형입니다: " + code);
        }
    }

    private void log(Long workItemId, Long actorId, String action, String from, String to) {
        log(workItemId, actorId, action, from, to, null);
    }

    private void log(Long workItemId, Long actorId, String action, String from, String to, String metadata) {
        activityLogMapper.insert(ActivityLog.builder()
                .workItemId(workItemId).actorId(actorId).action(action)
                .fromValue(from).toValue(to).metadata(metadata).build());
    }

    // ===================================================================
    // 인수조건 체크 (CR-049, WMP-WI-018)
    // ===================================================================

    /**
     * 인수조건 전체 배열 치환(WMP-WI-018). 체크로 바뀐 항목에 checkedBy=actorId·checkedAt=now,
     * 해제하면 clear. 텍스트만 신뢰하고 checkedBy/checkedAt은 서버가 판단한다.
     */
    @Transactional
    public WorkItemDtos.Response saveAcceptanceCriteria(
            Long id, WorkItemDtos.AcceptanceCriteriaRequest req, Long actorId) {
        WorkItem w = getEntity(id);
        OffsetDateTime now = OffsetDateTime.now(clock);
        List<AcceptanceCriterion> next = new java.util.ArrayList<>();
        for (WorkItemDtos.AcceptanceCriteriaRequest.AcceptanceItem item : req.criteria()) {
            next.add(AcceptanceCriterion.builder()
                    .text(item.text())
                    .checked(item.checked())
                    .checkedBy(item.checked() ? actorId : null)
                    .checkedAt(item.checked() ? now : null)
                    .build());
        }
        w.setAcceptanceCriteria(next);
        workItemMapper.updateAcceptanceCriteria(w);
        return WorkItemDtos.Response.from(getEntity(id));
    }

    /** 텍스트 목록 → 인수조건 객체 목록. prev가 있으면 같은 text의 체크 상태를 보존한다(텍스트 편집 시). */
    private List<AcceptanceCriterion> wrapCriteria(List<String> texts, List<AcceptanceCriterion> prev) {
        if (texts == null) {
            return null;
        }
        List<AcceptanceCriterion> result = new java.util.ArrayList<>();
        for (String text : texts) {
            AcceptanceCriterion match = null;
            if (prev != null) {
                for (AcceptanceCriterion p : prev) {
                    if (text.equals(p.getText())) { match = p; break; }
                }
            }
            if (match != null && match.isChecked()) {
                result.add(AcceptanceCriterion.builder()
                        .text(text).checked(true)
                        .checkedBy(match.getCheckedBy()).checkedAt(match.getCheckedAt()).build());
            } else {
                result.add(AcceptanceCriterion.builder().text(text).checked(false).build());
            }
        }
        return result;
    }

    /** 미충족(checked=false) 인수조건만. 없거나 비면 빈 리스트. */
    private List<AcceptanceCriterion> unmetCriteria(WorkItem w) {
        if (w.getAcceptanceCriteria() == null || w.getAcceptanceCriteria().isEmpty()) {
            return List.of();
        }
        List<AcceptanceCriterion> unmet = new java.util.ArrayList<>();
        for (AcceptanceCriterion c : w.getAcceptanceCriteria()) {
            if (!c.isChecked()) { unmet.add(c); }
        }
        return unmet;
    }

    /** 미충족 스냅샷 JSON(activity_logs.metadata) — {unmet:[text...], met:N, total:M}. */
    private String unmetSnapshot(List<AcceptanceCriterion> unmet, int met, int total) {
        try {
            java.util.List<String> texts = new java.util.ArrayList<>();
            for (AcceptanceCriterion c : unmet) { texts.add(c.getText()); }
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("unmet", texts);
            m.put("met", met);
            m.put("total", total);
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(m);
        } catch (Exception e) {
            return null;   // 스냅샷 실패가 완료를 막지 않는다(best-effort)
        }
    }
}
