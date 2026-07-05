package com.therecommerce.workmap.metrics.dto;

import java.util.List;

/**
 * 3차 지표 DTO (CR-043, WMP-HOME-010·012·013) — EVM·팀간 대기·운영적용률.
 * ⚠️ 일부는 데이터 입력 경로가 아직 없어(baseline 미입력·block_reason 자유텍스트·ops_apply 미기록)
 * "미설정/빈 지표"를 정직하게 반환한다. 입력 경로 신설은 후속.
 */
public final class AdvMetricsDtos {

    private AdvMetricsDtos() {}

    // ── EVM (WMP-HOME-013, F) ───────────────────────────────────────
    /** SPI/CPI. baseline(PV) 미설정이면 configured=false. */
    public record Evm(
            boolean configured,     // baseline(PV) 설정 여부
            int plannedPoints,      // PV 기준 총 계획 포인트
            int earnedPoints,       // EV = 완료 포인트
            double spi,             // EV/PV 비례(일정 효율, 1.0 기준)
            double cpi,             // EV/AC(비용 효율) — AC 근거 부재 시 0
            String note
    ) {}

    // ── 팀 간 대기 (WMP-HOME-012, E) ────────────────────────────────
    /** 대기 항목 한 줄. waitingOnTeam은 사유 구조화 전까지 null. */
    public record TeamWaitItem(
            Long id,
            String key,
            String title,
            String blockReason,
            long waitDays
    ) {}

    /** 팀 간 대기 응답. structured=false면 사유 구조화 미도입(block_reason 자유텍스트만). */
    public record TeamWait(
            boolean structured,
            long waitingCount,
            List<TeamWaitItem> items,
            String note
    ) {}

    // ── 운영 적용률 (WMP-HOME-010, F) ───────────────────────────────
    /** 개발완료 중 운영적용 비율. tracked=false면 ops_apply_status 미기록(현재 데이터 없음). */
    public record OpsApply(
            boolean tracked,
            long devDoneCount,
            long opsAppliedCount,
            int applyRatePct,
            String note
    ) {}
}
