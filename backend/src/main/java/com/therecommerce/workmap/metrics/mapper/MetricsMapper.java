package com.therecommerce.workmap.metrics.mapper;

import com.therecommerce.workmap.metrics.dto.AdvMetricsDtos;
import com.therecommerce.workmap.metrics.dto.FlowMetricsDtos;
import com.therecommerce.workmap.metrics.dto.MetricsDtos;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 프로젝트 건강 지표 1차 집계 매퍼 (CR-043, WMP-HOME-004~011).
 * 신규 테이블 없음 — work_items + activity_logs. 막힘=flagged(CR-040).
 */
@Mapper
public interface MetricsMapper {

    // Work Item Age (WMP-HOME-005)
    List<MetricsDtos.AgingItem> agingItems(@Param("projectId") Long projectId, @Param("sleDays") int sleDays);
    long blockedCount(@Param("projectId") Long projectId);
    long overSleCount(@Param("projectId") Long projectId, @Param("sleDays") int sleDays);

    // 재작업 (WMP-HOME-009)
    long everDoneCount(@Param("projectId") Long projectId);
    long reopenedCount(@Param("projectId") Long projectId);
    List<MetricsDtos.ReopenItem> reopenItems(@Param("projectId") Long projectId);

    // 담당자 과부하 (WMP-HOME-011)
    List<MetricsDtos.WorkloadRow> workload(@Param("projectId") Long projectId);

    // ── 2차 지표 (CR-043) ──────────────────────────────────────────

    // Cycle Time (WMP-HOME-006)
    List<FlowMetricsDtos.CycleTimePoint> cycleTimePoints(@Param("projectId") Long projectId);

    // CFD (WMP-HOME-007)
    List<Map<String, Object>> cfdBands(@Param("projectId") Long projectId,
                                       @Param("from") LocalDate from, @Param("to") LocalDate to);
    List<FlowMetricsDtos.StatusCount> currentStatusCounts(@Param("projectId") Long projectId);
    void upsertFlowSnapshot(@Param("projectId") Long projectId, @Param("snapshotDate") LocalDate snapshotDate,
                            @Param("commonStatus") String commonStatus, @Param("itemCount") int itemCount);
    List<Long> allActiveProjectIds();

    // 현장 검증률 (WMP-HOME-010)
    FlowMetricsDtos.FieldVerification fieldVerificationStats(@Param("projectId") Long projectId);

    // Monte Carlo 소스 (WMP-HOME-014)
    List<Integer> dailyThroughput(@Param("projectId") Long projectId, @Param("historyDays") int historyDays);

    // Say-Do (WMP-HOME-008)
    FlowMetricsDtos.SayDoCommitment doneAmongCommitted(@Param("sprintId") Long sprintId);
    void insertCommitment(@Param("sprintId") Long sprintId,
                          @Param("committedItemCount") int committedItemCount,
                          @Param("committedPoints") int committedPoints,
                          @Param("committedItemIds") List<Long> committedItemIds);

    // ── 3차 지표 (CR-043) ──────────────────────────────────────────

    // EVM (WMP-HOME-013)
    Map<String, Object> activeBaseline(@Param("projectId") Long projectId);
    int earnedPoints(@Param("projectId") Long projectId);

    // 팀 간 대기 (WMP-HOME-012)
    List<AdvMetricsDtos.TeamWaitItem> teamWaitItems(@Param("projectId") Long projectId);

    // 운영 적용률 (WMP-HOME-010)
    Map<String, Object> opsApplyStats(@Param("projectId") Long projectId);
}
