package com.therecommerce.workmap.metrics.dto;

import java.util.List;

/**
 * 프로젝트 건강 지표 체계 DTO (CR-043, WMP-HOME-004~015).
 * 업계 표준(애자일·Flow·품질·팀·EVM) → 우리 조직 매핑. "잘 됨"을 다축으로 증명.
 * 예외기반(E)=비면 건강 / 흐름기반(F)=추세로 판단. 막힘=flagged(CR-040).
 *
 * <p>MyBatis resultType 매핑 대상은 no-arg + setter(class), 서비스 조립 응답은 record.
 */
public final class MetricsDtos {

    private MetricsDtos() {}

    // ── 종합 건강 판정 (WMP-HOME-004) ────────────────────────────────

    /** 축 하나의 건강 상태. status = OK | WARN | CRIT. */
    public record AxisHealth(
            String axis,        // FLOW | PREDICT | QUALITY | TEAM | SCHEDULE
            String label,       // 흐름 / 예측가능성 / 품질 / 팀 부하 / 일정
            String status,      // OK | WARN | CRIT
            String summary      // 한 줄 근거
    ) {}

    /** 프로젝트 종합 건강 판정: 스코어(0~100) + 축별 신호등 + 헤드라인. */
    public record Health(
            Long projectId,
            String projectName,
            int score,              // 0~100 가중 합산
            String verdict,         // 대체로 순조로움 / 주의 필요 / 위험
            List<AxisHealth> axes
    ) {}

    // ── Work Item Age · 멈춘 일 (WMP-HOME-005, E, A축) ───────────────

    /** aging 항목 한 줄. flagged=막힘, ageDays=진행 시작 후 경과일. */
    public static class AgingItem {
        private Long id;
        private String key;
        private String title;
        private String commonStatus;
        private boolean flagged;
        private String blockReason;
        private Long assigneeId;
        private long ageDays;        // status_changed_at 기준 경과일(막힘이면 막힌 일수)

        public Long getId() { return id; }
        public void setId(Long v) { this.id = v; }
        public String getKey() { return key; }
        public void setKey(String v) { this.key = v; }
        public String getTitle() { return title; }
        public void setTitle(String v) { this.title = v; }
        public String getCommonStatus() { return commonStatus; }
        public void setCommonStatus(String v) { this.commonStatus = v; }
        public boolean isFlagged() { return flagged; }
        public void setFlagged(boolean v) { this.flagged = v; }
        public String getBlockReason() { return blockReason; }
        public void setBlockReason(String v) { this.blockReason = v; }
        public Long getAssigneeId() { return assigneeId; }
        public void setAssigneeId(Long v) { this.assigneeId = v; }
        public long getAgeDays() { return ageDays; }
        public void setAgeDays(long v) { this.ageDays = v; }
    }

    /** Aging 응답: SLE 임계 + 초과/근접 목록 + 요약. */
    public record Aging(
            int sleDays,            // Service Level Expectation(기본 임계, 초과 시 위험)
            long blockedCount,      // 막힌(flagged) 전체
            long overSleCount,      // SLE 초과 항목 수
            List<AgingItem> items   // 초과·근접 항목(정렬: 경과일 DESC)
    ) {}

    // ── 재작업률 · Reopen Rate (WMP-HOME-009, E, D축) ────────────────

    /** 재오픈된 항목 한 줄. */
    public static class ReopenItem {
        private Long id;
        private String key;
        private String title;
        private long reopenCount;   // DONE→non-DONE 전이 횟수
        private Long assigneeId;

        public Long getId() { return id; }
        public void setId(Long v) { this.id = v; }
        public String getKey() { return key; }
        public void setKey(String v) { this.key = v; }
        public String getTitle() { return title; }
        public void setTitle(String v) { this.title = v; }
        public long getReopenCount() { return reopenCount; }
        public void setReopenCount(long v) { this.reopenCount = v; }
        public Long getAssigneeId() { return assigneeId; }
        public void setAssigneeId(Long v) { this.assigneeId = v; }
    }

    /** 재작업 응답: 재오픈 비율 + 목록. reopenRate = 재오픈된 항목수 / 완료 이력 있는 항목수. */
    public record Rework(
            long everDoneCount,     // 한 번이라도 DONE에 도달한 항목 수(분모)
            long reopenedCount,     // 그 중 재오픈된 항목 수(분자)
            int reopenRatePct,      // 0~100 (낮을수록 건강, 기준 10%)
            List<ReopenItem> items
    ) {}

    // ── 담당자 과부하 (WMP-HOME-011, E, E축) ─────────────────────────

    /** 담당자별 부하 한 줄. 위험도 = 지연·막힘 동시 보유. */
    public static class WorkloadRow {
        private Long assigneeId;
        private long inProgress;    // 진행 중(미완료)
        private long delayed;       // 지연(due 초과 미완료)
        private long blocked;       // 막힘(flagged)

        public Long getAssigneeId() { return assigneeId; }
        public void setAssigneeId(Long v) { this.assigneeId = v; }
        public long getInProgress() { return inProgress; }
        public void setInProgress(long v) { this.inProgress = v; }
        public long getDelayed() { return delayed; }
        public void setDelayed(long v) { this.delayed = v; }
        public long getBlocked() { return blocked; }
        public void setBlocked(long v) { this.blocked = v; }
    }

    /** 과부하 응답: 담당자별 부하 + 위험 판정(서비스에서 risk 계산). */
    public record Workload(
            List<WorkloadRow> rows
    ) {}
}
