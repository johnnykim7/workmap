package com.therecommerce.workmap.dashboard.mapper;

import com.therecommerce.workmap.dashboard.dto.DashboardDtos;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 회사홈/보고 집계 매퍼 (T3-2 G, WMP-HOME-001~003). 가시성(BIZ-108)은 visibleProjectIds로 강제 —
 * 빈 목록이면 결과 없음. 지연/정체 기준은 POL-002(due_date &lt; today, 제외 {DONE,HOLD}),
 * POL-003(status_changed_at &lt; now - staleDays).
 */
@Mapper
public interface DashboardMapper {

    // ── 막힘/지연/미배정 목록 (mode = BLOCKED | DELAYED | UNASSIGNED) ──
    List<WorkItem> findByMode(@Param("mode") String mode,
                              @Param("visibleProjectIds") List<Long> visibleProjectIds,
                              @Param("projectId") Long projectId,
                              @Param("staleDays") int staleDays,
                              @Param("limit") int limit,
                              @Param("offset") int offset);

    long countByMode(@Param("mode") String mode,
                     @Param("visibleProjectIds") List<Long> visibleProjectIds,
                     @Param("projectId") Long projectId,
                     @Param("staleDays") int staleDays);

    // ── 지표 카드 (WMP-HOME-001) ──
    DashboardDtos.Metrics metrics(@Param("visibleProjectIds") List<Long> visibleProjectIds,
                                  @Param("projectId") Long projectId,
                                  @Param("staleDays") int staleDays);

    // ── 프로젝트 보고서 분포 (WMP-HOME-003) ──
    List<DashboardDtos.Distribution> distributionByStatus(@Param("projectId") Long projectId);

    List<DashboardDtos.Distribution> distributionByType(@Param("projectId") Long projectId);

    List<DashboardDtos.Distribution> distributionByAssignee(@Param("projectId") Long projectId);
}
