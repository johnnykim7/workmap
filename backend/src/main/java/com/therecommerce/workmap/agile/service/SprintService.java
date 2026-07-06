package com.therecommerce.workmap.agile.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.agile.domain.Sprint;
import com.therecommerce.workmap.agile.domain.SprintStatus;
import com.therecommerce.workmap.agile.dto.SprintDtos;
import com.therecommerce.workmap.agile.mapper.SprintMapper;
import com.therecommerce.workmap.common.event.SprintEvents;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 스프린트 서비스(Sprint 4, WMP-AGL-001/003/004). 스프린트 FSM(T1-5): FUTURE→ACTIVE→COMPLETED.
 *
 * <ul>
 *   <li>시작(SPR-2): 프로젝트당 동시 ACTIVE 1개 보장(SPR-1), 기간 고정, SprintStarted 발행.</li>
 *   <li>완료(SPR-3): 미완료 항목 다음 스프린트/백로그 이월(동일 트랜잭션), SprintCompleted 발행.</li>
 *   <li>COMPLETED는 최종 상태(SPR-4) — 재개 불가.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintMapper sprintMapper;
    private final ProjectMapper projectMapper;
    private final WorkItemMapper workItemMapper;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    // ===================================================================
    // CRUD / 목록 / 백로그
    // ===================================================================

    @Transactional
    public SprintDtos.Response create(Long projectId, SprintDtos.CreateRequest req, Long actorId) {
        Project project = projectMapper.findById(projectId);
        if (project == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        if (req.startDate() != null && req.endDate() != null && req.startDate().isAfter(req.endDate())) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "시작일이 종료일보다 늦을 수 없습니다.");
        }
        Integer max = sprintMapper.maxSortOrder(projectId);
        Sprint sprint = Sprint.builder()
                .projectId(projectId)
                .name(req.name())
                .goal(req.goal())
                .status(SprintStatus.FUTURE.name())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .sortOrder(max == null ? 0 : max + 1)
                .build();
        sprintMapper.insert(sprint);
        return SprintDtos.Response.from(sprintMapper.findById(sprint.getId()));
    }

    @Transactional(readOnly = true)
    public List<SprintDtos.Response> list(Long projectId) {
        return sprintMapper.findByProject(projectId).stream()
                .map(SprintDtos.Response::from)
                .toList();
    }

    /** 스프린트 편집(WMP-AGL-007, CR-038). status 무변경 — 어느 상태에서든 name/goal/기간 수정. */
    @Transactional
    public SprintDtos.Response update(Long sprintId, SprintDtos.UpdateRequest req, Long actorId) {
        Sprint s = getEntity(sprintId);
        if (req.startDate() != null && req.endDate() != null && req.startDate().isAfter(req.endDate())) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "시작일이 종료일보다 늦을 수 없습니다.");
        }
        s.setName(req.name());
        s.setGoal(req.goal());
        s.setStartDate(req.startDate());
        s.setEndDate(req.endDate());
        sprintMapper.updateEdit(s);
        return SprintDtos.Response.from(sprintMapper.findById(sprintId));
    }

    /**
     * 스프린트 삭제(WMP-AGL-008, CR-038). **FUTURE만** 허용(FSM 가드).
     * 담긴 워크아이템은 백로그로 복귀(sprint_id=null) 후 스프린트 하드 삭제.
     */
    @Transactional
    public SprintDtos.DeleteResult delete(Long sprintId, Long actorId) {
        Sprint s = getEntity(sprintId);
        if (!SprintStatus.FUTURE.name().equals(s.getStatus())) {
            throw new BusinessException(WmpErrorCode.SPRINT_DELETE_NOT_FUTURE);
        }
        List<WorkItem> items = workItemMapper.findBySprint(sprintId);
        for (WorkItem w : items) {
            workItemMapper.updateSprint(w.getId(), null);  // 백로그 복귀
        }
        sprintMapper.deleteById(sprintId);
        return new SprintDtos.DeleteResult(sprintId, items.size());
    }

    @Transactional(readOnly = true)
    public Sprint getEntity(Long id) {
        Sprint s = sprintMapper.findById(id);
        if (s == null) {
            throw new BusinessException(WmpErrorCode.SPRINT_NOT_FOUND);
        }
        return s;
    }

    /** 백로그 화면(WMP-AGL-001): FUTURE/ACTIVE 스프린트 구역들 + 백로그 구역(기본). */
    @Transactional(readOnly = true)
    public SprintDtos.BacklogResponse backlog(Long projectId) {
        return backlog(projectId, false);
    }

    /**
     * 백로그 화면(WMP-AGL-001, CR-041). FUTURE/ACTIVE 스프린트 구역들 + 백로그 구역.
     * <p>includeCompleted=true면 완료(COMPLETED) 스프린트 구역을 <b>맨 앞·오래된 순</b>에 함께 포함
     * (Jira처럼 지난 스프린트를 백로그에서 접힌 채 조망). 기본(false)은 완료 제외(기존 동작).
     * {@code findByProject}가 이미 sort_order ASC, id ASC라 완료도 오래된 순 자연 정렬.
     */
    @Transactional(readOnly = true)
    public SprintDtos.BacklogResponse backlog(Long projectId, boolean includeCompleted) {
        if (projectMapper.findById(projectId) == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        List<SprintDtos.BacklogSection> completedSections = new ArrayList<>();  // 맨 앞에 배치할 완료 구역
        List<SprintDtos.BacklogSection> activeSections = new ArrayList<>();     // 진행/예정 구역
        for (Sprint s : sprintMapper.findByProject(projectId)) {
            boolean completed = SprintStatus.COMPLETED.name().equals(s.getStatus());
            if (completed && !includeCompleted) {
                continue;  // 완료 스프린트는 기본 제외(토글 off)
            }
            List<WorkItem> items = workItemMapper.findByProjectAndSprint(projectId, s.getId(), false, false);
            (completed ? completedSections : activeSections).add(section(s, items));
        }
        // 완료(오래된 순) → 진행/예정 순으로 배치.
        List<SprintDtos.BacklogSection> sprintSections = new ArrayList<>(completedSections);
        sprintSections.addAll(activeSections);
        // 백로그 영역만 AI 초안(draft=true) 포함 — FE가 draft 필드로 "초안" 구분표시(BIZ-117, CR-050).
        List<WorkItem> backlogItems = workItemMapper.findByProjectAndSprint(projectId, null, true, true);
        return new SprintDtos.BacklogResponse(projectId, sprintSections, section(null, backlogItems));
    }

    private SprintDtos.BacklogSection section(Sprint sprint, List<WorkItem> items) {
        int sp = items.stream()
                .filter(i -> i.getStoryPoints() != null)
                .mapToInt(WorkItem::getStoryPoints).sum();
        List<WorkItemDtos.Response> dtos = items.stream().map(WorkItemDtos.Response::from).toList();
        return new SprintDtos.BacklogSection(sprint, dtos, items.size(), sp);
    }

    // ===================================================================
    // FSM: 시작 / 완료
    // ===================================================================

    /** 스프린트 시작(SPR-2). CR-039: 병렬 스프린트 허용 — 앞 ACTIVE 존재해도 시작 가능(SPR-1 폐기). 기간 고정, SprintStarted 발행. */
    @Transactional
    public SprintDtos.Response start(Long sprintId, SprintDtos.StartRequest req, Long actorId) {
        Sprint s = getEntity(sprintId);
        if (!SprintStatus.FUTURE.name().equals(s.getStatus())) {
            throw new BusinessException(WmpErrorCode.SPRINT_NOT_FUTURE);  // SPR-4(COMPLETED→ACTIVE 포함)
        }
        // CR-039: 병렬 스프린트 허용 — SPR-1(동시 ACTIVE 1개) 폐기. 앞 ACTIVE 존재 검사 삭제.

        OffsetDateTime now = OffsetDateTime.now(clock);
        LocalDate startDate = req != null && req.startDate() != null ? req.startDate()
                : (s.getStartDate() != null ? s.getStartDate() : now.toLocalDate());
        LocalDate endDate = req != null && req.endDate() != null ? req.endDate() : s.getEndDate();
        if (endDate != null && startDate.isAfter(endDate)) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "시작일이 종료일보다 늦을 수 없습니다.");
        }

        s.setStartDate(startDate);
        s.setEndDate(endDate);
        s.setStartedAt(now);
        sprintMapper.updateStart(s);

        // 포함 항목 확정(committedItems) — 시작 시점 스프린트 소속 항목
        List<Long> committed = workItemMapper.findBySprint(sprintId).stream()
                .map(WorkItem::getId).toList();

        events.publishEvent(new SprintEvents.SprintStarted(
                sprintId, s.getProjectId(), committed, startDate, endDate, actorId, now));

        return SprintDtos.Response.from(sprintMapper.findById(sprintId));
    }

    /** 스프린트 완료(SPR-3). 미완료 항목 이월(동일 트랜잭션), SprintCompleted 발행. */
    @Transactional
    public SprintDtos.CompleteResult complete(Long sprintId, SprintDtos.CompleteRequest req, Long actorId) {
        Sprint s = getEntity(sprintId);
        if (!SprintStatus.ACTIVE.name().equals(s.getStatus())) {
            throw new BusinessException(WmpErrorCode.SPRINT_NOT_ACTIVE);  // SPR-4
        }

        Long carryTo = req == null ? null : req.carryToSprintId();
        if (carryTo != null) {
            // 이월 대상은 같은 프로젝트의 미완료(FUTURE/ACTIVE) 스프린트여야 함
            Sprint target = getEntity(carryTo);
            if (!target.getProjectId().equals(s.getProjectId())
                    || SprintStatus.COMPLETED.name().equals(target.getStatus())) {
                throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "이월 대상 스프린트가 올바르지 않습니다.");
            }
        }

        List<WorkItem> done = workItemMapper.findDoneBySprint(sprintId);
        List<WorkItem> unfinished = workItemMapper.findUnfinishedBySprint(sprintId);

        List<SprintEvents.CarriedOver> carried = new ArrayList<>();
        for (WorkItem w : unfinished) {
            workItemMapper.updateSprint(w.getId(), carryTo);   // 다음 스프린트(또는 백로그=null)로 이월
            carried.add(new SprintEvents.CarriedOver(w.getId(), carryTo));
        }

        OffsetDateTime now = OffsetDateTime.now(clock);
        sprintMapper.updateComplete(sprintId, now);

        events.publishEvent(new SprintEvents.SprintCompleted(
                sprintId, s.getProjectId(),
                done.stream().map(WorkItem::getId).toList(),
                carried, now, actorId));

        return new SprintDtos.CompleteResult(sprintId, done.size(), carried.size(), carryTo);
    }
}
