package com.therecommerce.workmap.metrics.mapper;

import com.therecommerce.workmap.metrics.dto.MetricsDtos;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

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
}
