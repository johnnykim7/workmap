package com.therecommerce.workmap.metrics.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * 흐름·예측 지표 DTO (CR-043, WMP-HOME-006·007·008·010·014, 2차).
 * Cycle Time(백분위 SLE) · CFD(누적흐름) · Say-Do Ratio · 현장검증률 · Monte Carlo.
 * 흐름기반(F) — 추세·형태로 건강 판단. 백분위 사용(평균 아님).
 */
public final class FlowMetricsDtos {

    private FlowMetricsDtos() {}

    // ── Cycle Time (WMP-HOME-006, F) ────────────────────────────────
    /** 완료 항목 한 건의 사이클타임(첫 IN_PROGRESS ~ 첫 DONE, 일). 산점도 점. */
    public static class CycleTimePoint {
        private Long id;
        private String key;
        private java.time.OffsetDateTime firstDone;
        private double days;

        public Long getId() { return id; }
        public void setId(Long v) { this.id = v; }
        public String getKey() { return key; }
        public void setKey(String v) { this.key = v; }
        public java.time.OffsetDateTime getFirstDone() { return firstDone; }
        public void setFirstDone(java.time.OffsetDateTime v) { this.firstDone = v; }
        public double getDays() { return days; }
        public void setDays(double v) { this.days = v; }
    }

    /** Cycle Time 응답: 85%p SLE("85%가 N일 내 완료") + 산점도. */
    public record CycleTime(
            int sampleSize,
            double p50Days,        // 중앙값
            double p85Days,        // SLE — "85%가 이 일수 내 완료"
            List<CycleTimePoint> points
    ) {}

    // ── CFD (WMP-HOME-007, F) ───────────────────────────────────────
    /** 하루의 상태별 카운트(밴드). */
    public record CfdDay(
            LocalDate date,
            List<StatusCount> bands   // 상태별 항목 수
    ) {}
    public record StatusCount(String commonStatus, int count) {}

    /** CFD 응답: 기간 내 일별 밴드 시계열. */
    public record Cfd(
            LocalDate from,
            LocalDate to,
            List<CfdDay> days
    ) {}

    // ── Say-Do Ratio (WMP-HOME-008, F) ──────────────────────────────
    /** 스프린트별 약속/완료. sayDoPct = 완료÷약속. */
    public record SayDoSprint(
            Long sprintId,
            String sprintName,
            int committedPoints,   // 약속(동결값)
            int committedItems,
            int donePoints,        // 완료(그 중 DONE)
            int doneItems,
            int sayDoPct,          // 0~ (80~110 건강)
            int scopeChangePct     // 스코프 변경률(시작후 추가/제거 ÷ 약속)
    ) {}
    public record SayDo(
            List<SayDoSprint> sprints
    ) {}

    // ── 현장 검증률 (WMP-HOME-010, E/F) ─────────────────────────────
    public record FieldVerification(
            long total,
            long passed,
            long failed,
            long partial,
            int passRatePct        // PASS ÷ total
    ) {}

    // ── Monte Carlo 완료 예측 (WMP-HOME-014, F) ─────────────────────
    /** 확률별 완료 건수 예측(목표일까지). */
    public record ForecastPoint(int confidencePct, int itemsByTarget) {}

    public record Forecast(
            int historyDays,       // 참조한 이력 기간
            double avgThroughputPerDay,
            int targetDays,        // 예측 대상 기간(오늘부터)
            List<ForecastPoint> distribution  // 50/70/85/95% 확률별 완료 건수
    ) {}
}
