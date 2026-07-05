package com.therecommerce.workmap.metrics.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.metrics.dto.AdvMetricsDtos;
import com.therecommerce.workmap.metrics.dto.FlowMetricsDtos;
import com.therecommerce.workmap.metrics.dto.MetricsDtos;
import com.therecommerce.workmap.metrics.service.AdvMetricsService;
import com.therecommerce.workmap.metrics.service.FlowMetricsService;
import com.therecommerce.workmap.metrics.service.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * 프로젝트 건강 지표 API (CR-043, WMP-HOME-004~011). 인증 필요(🔒), GET 조회만(VIEWER 허용).
 *
 * <p>전부 프로젝트 단건 범위. 가시성(BIZ-108)은 서비스가 findVisible로 가드.
 * 막힘=flagged(CR-040). 1차 = 종합 판정 + 예외축 3종(Age·재작업·과부하).
 * 2·3차(cycle-time·cfd·say-do·forecast·evm·team-wait)는 설계 정의됨, 구현 후속.
 */
@RestController
@RequestMapping("/api/v1/projects/{id}")
@RequiredArgsConstructor
public class MetricsController {

    private final MetricsService metricsService;
    private final FlowMetricsService flowMetricsService;
    private final AdvMetricsService advMetricsService;

    /** 종합 건강 판정(스코어 + 축별 신호등). WMP-HOME-004. */
    @GetMapping("/health")
    public ResponseDto<MetricsDtos.Health> health(
            @PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(metricsService.health(id, userId));
    }

    /** Work Item Age · 멈춘 일(SLE 초과/근접, 막힘 우선). WMP-HOME-005, E. */
    @GetMapping("/metrics/aging")
    public ResponseDto<MetricsDtos.Aging> aging(
            @PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(metricsService.aging(id, userId));
    }

    /** 재작업률 · Reopen Rate(DONE→재오픈). WMP-HOME-009, E. */
    @GetMapping("/metrics/rework")
    public ResponseDto<MetricsDtos.Rework> rework(
            @PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(metricsService.rework(id, userId));
    }

    /** 담당자 과부하(진행/지연/막힘 교차). WMP-HOME-011, E. */
    @GetMapping("/metrics/workload")
    public ResponseDto<MetricsDtos.Workload> workload(
            @PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(metricsService.workload(id, userId));
    }

    // ── 2차 지표 (흐름·예측) ────────────────────────────────────────

    /** Cycle Time 백분위 SLE + 산점도. WMP-HOME-006, F. */
    @GetMapping("/metrics/cycle-time")
    public ResponseDto<FlowMetricsDtos.CycleTime> cycleTime(
            @PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(flowMetricsService.cycleTime(id, userId));
    }

    /** CFD 누적 흐름도(일별 밴드). WMP-HOME-007, F. */
    @GetMapping("/metrics/cfd")
    public ResponseDto<FlowMetricsDtos.Cfd> cfd(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(flowMetricsService.cfd(id, userId, from, to));
    }

    /** Say-Do Ratio(스프린트별 약속/완료). WMP-HOME-008, F. */
    @GetMapping("/metrics/say-do")
    public ResponseDto<FlowMetricsDtos.SayDo> sayDo(
            @PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(flowMetricsService.sayDo(id, userId));
    }

    /** 현장 검증률(PASS/FAIL/PARTIAL). WMP-HOME-010, E/F. */
    @GetMapping("/metrics/field-verification")
    public ResponseDto<FlowMetricsDtos.FieldVerification> fieldVerification(
            @PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(flowMetricsService.fieldVerification(id, userId));
    }

    /** Monte Carlo 완료 예측(확률별 완료 건수). WMP-HOME-014, F. */
    @GetMapping("/metrics/forecast")
    public ResponseDto<FlowMetricsDtos.Forecast> forecast(
            @PathVariable Long id,
            @RequestParam(defaultValue = "14") int targetDays,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(flowMetricsService.forecast(id, userId, targetDays));
    }

    // ── 3차 지표 (EVM·팀간대기·운영적용률) ──────────────────────────
    // ⚠️ 데이터 입력 경로가 없는 지표는 configured/tracked=false로 정직 반환.

    /** EVM SPI/CPI(획득가치). baseline 미설정 시 configured=false. WMP-HOME-013, F. */
    @GetMapping("/metrics/evm")
    public ResponseDto<AdvMetricsDtos.Evm> evm(
            @PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(advMetricsService.evm(id, userId));
    }

    /** 팀 간 대기(막힘 항목·경과일). 사유 구조화 전 structured=false. WMP-HOME-012, E. */
    @GetMapping("/metrics/team-wait")
    public ResponseDto<AdvMetricsDtos.TeamWait> teamWait(
            @PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(advMetricsService.teamWait(id, userId));
    }

    /** 운영 적용률(개발완료 中 운영적용). ops_apply 미기록 시 tracked=false. WMP-HOME-010, F. */
    @GetMapping("/metrics/ops-apply")
    public ResponseDto<AdvMetricsDtos.OpsApply> opsApply(
            @PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(advMetricsService.opsApply(id, userId));
    }
}
