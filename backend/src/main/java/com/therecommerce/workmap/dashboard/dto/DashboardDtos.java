package com.therecommerce.workmap.dashboard.dto;

import com.therecommerce.workmap.project.dto.ProjectSummary;

import java.util.List;

/**
 * 회사홈/보고 응답 DTO (T3-2 G, WMP-HOME-001~003).
 * Metrics/Distribution은 MyBatis가 resultType으로 직접 채우는 집계 행이라 setter 기반(class).
 */
public final class DashboardDtos {

    private DashboardDtos() {}

    /**
     * 지표 카드(WMP-HOME-001): 진행중/오늘마감/이번주마감/미배정/장기미변경.
     * MyBatis resultType 매핑 대상 — no-arg + setter.
     */
    public static class Metrics {
        private long inProgress;
        private long dueToday;
        private long dueThisWeek;
        private long unassigned;
        private long stale;

        public long getInProgress() { return inProgress; }
        public void setInProgress(long v) { this.inProgress = v; }
        public long getDueToday() { return dueToday; }
        public void setDueToday(long v) { this.dueToday = v; }
        public long getDueThisWeek() { return dueThisWeek; }
        public void setDueThisWeek(long v) { this.dueThisWeek = v; }
        public long getUnassigned() { return unassigned; }
        public void setUnassigned(long v) { this.unassigned = v; }
        public long getStale() { return stale; }
        public void setStale(long v) { this.stale = v; }
    }

    /** 분포 위젯 한 칸(상태별/유형별/담당자별 공통): key=라벨/코드, count=건수. */
    public static class Distribution {
        private String key;
        private long count;

        public String getKey() { return key; }
        public void setKey(String key) { this.key = key; }
        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    /**
     * 프로젝트 보고서(WMP-HOME-003): 진행률/지연/막힘(ProjectSummary) + 분포 위젯.
     * 담당자 부하 = byAssignee 분포.
     */
    public record Report(
            Long projectId,
            String projectName,
            ProjectSummary summary,
            List<Distribution> byStatus,
            List<Distribution> byType,
            List<Distribution> byAssignee
    ) {}
}
