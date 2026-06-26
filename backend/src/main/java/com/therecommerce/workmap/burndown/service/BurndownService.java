package com.therecommerce.workmap.burndown.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.agile.domain.Sprint;
import com.therecommerce.workmap.agile.domain.SprintStatus;
import com.therecommerce.workmap.agile.mapper.SprintMapper;
import com.therecommerce.workmap.burndown.domain.BurndownSnapshot;
import com.therecommerce.workmap.burndown.dto.BurndownDtos;
import com.therecommerce.workmap.burndown.mapper.BurndownMapper;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 번다운/번업·벨로시티(WMP-AGL-006, CR-012).
 *
 * <ul>
 *   <li>적재(쓰기): {@code snapshotStart}/{@code snapshotDaily}/{@code snapshotComplete} —
 *       이벤트 리스너(SprintStarted/Completed)와 일별 스케줄러가 호출. UNIQUE upsert로 멱등.</li>
 *   <li>조회(읽기): {@code burndown}(스프린트 시계열) / {@code velocity}(프로젝트 완료 스프린트 평균).</li>
 * </ul>
 *
 * <p>포인트 집계: 잔여=미완료 항목 스토리포인트 합, 완료=완료 항목 스토리포인트 합.
 * story_points가 null인 항목은 0으로 본다(백로그 화면 집계와 동일 규칙 — SprintService.section).
 */
@Service
@RequiredArgsConstructor
public class BurndownService {

    private final BurndownMapper burndownMapper;
    private final SprintMapper sprintMapper;
    private final WorkItemMapper workItemMapper;

    // ===================================================================
    // 적재(쓰기) — 이벤트/배치가 호출
    // ===================================================================

    /** 시작 기준선(START): total 고정, remaining=total, completed=0. */
    @Transactional
    public void snapshotStart(Long sprintId, LocalDate date) {
        int total = sumPoints(workItemMapper.findBySprint(sprintId));
        burndownMapper.upsert(BurndownSnapshot.builder()
                .sprintId(sprintId).snapshotDate(date)
                .remainingPoints(total).completedPoints(0).totalPoints(total)
                .snapshotType("START").build());
    }

    /** 일별(DAILY): 당일 종료 시점 잔여/누적완료 재계산. total은 기준선 유지(START 스냅샷 참조). */
    @Transactional
    public void snapshotDaily(Long sprintId, LocalDate date) {
        upsertProgress(sprintId, date, "DAILY");
    }

    /** 완료(COMPLETE): 완료 시점 최종 스냅샷(벨로시티 기준). */
    @Transactional
    public void snapshotComplete(Long sprintId, LocalDate date) {
        upsertProgress(sprintId, date, "COMPLETE");
    }

    private void upsertProgress(Long sprintId, LocalDate date, String type) {
        int remaining = sumPoints(workItemMapper.findUnfinishedBySprint(sprintId));
        int completed = sumPoints(workItemMapper.findDoneBySprint(sprintId));
        int total = baseline(sprintId, remaining + completed);
        burndownMapper.upsert(BurndownSnapshot.builder()
                .sprintId(sprintId).snapshotDate(date)
                .remainingPoints(remaining).completedPoints(completed).totalPoints(total)
                .snapshotType(type).build());
    }

    /** 기준선 total: START 스냅샷이 있으면 그 값, 없으면 현재 합(시작 누락 보정). */
    private int baseline(Long sprintId, int fallback) {
        return burndownMapper.findBySprint(sprintId).stream()
                .filter(s -> "START".equals(s.getSnapshotType()))
                .map(BurndownSnapshot::getTotalPoints)
                .findFirst().orElse(fallback);
    }

    private int sumPoints(List<WorkItem> items) {
        return items.stream()
                .filter(i -> i.getStoryPoints() != null)
                .mapToInt(WorkItem::getStoryPoints).sum();
    }

    // ===================================================================
    // 조회(읽기)
    // ===================================================================

    /** 스프린트 번다운/번업: 일자별 잔여/누적완료/기준선. FUTURE(미시작)는 스냅샷 없음 → 거부. */
    @Transactional(readOnly = true)
    public BurndownDtos.BurndownResponse burndown(Long sprintId) {
        Sprint sprint = sprintMapper.findById(sprintId);
        if (sprint == null) {
            throw new BusinessException(WmpErrorCode.SPRINT_NOT_FOUND);
        }
        if (SprintStatus.FUTURE.name().equals(sprint.getStatus())) {
            throw new BusinessException(WmpErrorCode.SPRINT_NOT_STARTED);
        }
        List<BurndownSnapshot> snapshots = burndownMapper.findBySprint(sprintId);
        int total = snapshots.stream()
                .map(BurndownSnapshot::getTotalPoints)
                .filter(t -> t != null && t > 0)
                .findFirst().orElse(0);
        List<BurndownDtos.Point> points = snapshots.stream().map(BurndownDtos.Point::from).toList();
        return new BurndownDtos.BurndownResponse(sprintId, total, points);
    }

    /** 프로젝트 벨로시티: 완료 스프린트별 완료포인트 + 평균. */
    @Transactional(readOnly = true)
    public BurndownDtos.VelocityResponse velocity(Long projectId) {
        List<BurndownDtos.VelocityItem> items = burndownMapper.findCompletedByProject(projectId).stream()
                .map(BurndownDtos.VelocityItem::from).toList();
        double avg = items.isEmpty() ? 0.0
                : items.stream().mapToInt(BurndownDtos.VelocityItem::completedPoints).average().orElse(0.0);
        return new BurndownDtos.VelocityResponse(projectId, items, avg);
    }
}
