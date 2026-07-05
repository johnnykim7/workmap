package com.therecommerce.workmap.metrics.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.metrics.dto.MetricsDtos;
import com.therecommerce.workmap.metrics.service.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
}
