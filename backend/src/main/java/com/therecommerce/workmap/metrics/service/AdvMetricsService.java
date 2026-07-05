package com.therecommerce.workmap.metrics.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.metrics.dto.AdvMetricsDtos;
import com.therecommerce.workmap.metrics.mapper.MetricsMapper;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * 3차 지표 서비스 (CR-043) — EVM·팀간 대기·운영적용률.
 *
 * <p>⚠️ 데이터 입력 경로가 아직 없는 지표는 정직하게 "미설정/미추적"을 반환한다:
 * <ul>
 *   <li>EVM: project_baselines에 활성 baseline이 없으면 configured=false.</li>
 *   <li>팀 간 대기: block_reason이 자유텍스트라 "어느 팀 대기" 구조화 전 — structured=false, 원문만.</li>
 *   <li>운영적용률: ops_apply_status가 미기록 컬럼이면 tracked=false.</li>
 * </ul>
 * 입력 경로(계획 확정 UI·사유 구조화·ops 상태 기록)는 후속 CR.
 */
@Service
@RequiredArgsConstructor
public class AdvMetricsService {

    private final MetricsMapper metricsMapper;
    private final ProjectMapper projectMapper;

    private void requireVisible(Long projectId, Long viewerId) {
        if (projectMapper.findById(projectId) == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        boolean visible = projectMapper.findVisible(viewerId, null, null, null, true)
                .stream().anyMatch(p -> p.getId().equals(projectId));
        if (!visible) {
            throw new BusinessException(WmpErrorCode.NOT_PROJECT_MEMBER);
        }
    }

    // ── EVM (WMP-HOME-013) ──────────────────────────────────────────
    @Transactional(readOnly = true)
    public AdvMetricsDtos.Evm evm(Long projectId, Long viewerId) {
        requireVisible(projectId, viewerId);
        Map<String, Object> baseline = metricsMapper.activeBaseline(projectId);
        if (baseline == null || baseline.get("plannedPoints") == null) {
            return new AdvMetricsDtos.Evm(false, 0, 0, 0, 0,
                    "baseline(계획값) 미설정 — 프로젝트 계획 확정 후 SPI/CPI 산출");
        }
        int plannedPoints = ((Number) baseline.get("plannedPoints")).intValue();
        int earned = metricsMapper.earnedPoints(projectId);
        // SPI = EV/PV(포인트 진척 기준 근사). CPI는 AC(실제비용) 근거 부재라 0(후속).
        double spi = plannedPoints == 0 ? 0 : round2((double) earned / plannedPoints);
        return new AdvMetricsDtos.Evm(true, plannedPoints, earned, spi, 0,
                "SPI=EV/PV(포인트 진척). CPI는 실제비용(AC) 기록 도입 후.");
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }

    // ── 팀 간 대기 (WMP-HOME-012) ───────────────────────────────────
    @Transactional(readOnly = true)
    public AdvMetricsDtos.TeamWait teamWait(Long projectId, Long viewerId) {
        requireVisible(projectId, viewerId);
        List<AdvMetricsDtos.TeamWaitItem> items = metricsMapper.teamWaitItems(projectId);
        return new AdvMetricsDtos.TeamWait(
                false,  // 사유 구조화(대기 대상 팀) 미도입
                items.size(),
                items,
                "막힘 사유 구조화 전 — block_reason 원문. '어느 팀 대기'는 사유 구조화(후속) 후.");
    }

    // ── 운영 적용률 (WMP-HOME-010) ──────────────────────────────────
    @Transactional(readOnly = true)
    public AdvMetricsDtos.OpsApply opsApply(Long projectId, Long viewerId) {
        requireVisible(projectId, viewerId);
        Map<String, Object> s = metricsMapper.opsApplyStats(projectId);
        long devDone = num(s.get("devDone"));
        long opsApplied = num(s.get("opsApplied"));
        long anyOpsStatus = num(s.get("anyOpsStatus"));
        boolean tracked = anyOpsStatus > 0;  // ops_apply_status 값이 하나라도 있으면 추적 중
        int rate = devDone == 0 ? 0 : (int) Math.round(100.0 * opsApplied / devDone);
        return new AdvMetricsDtos.OpsApply(
                tracked, devDone, opsApplied, rate,
                tracked ? "개발완료 中 운영적용(APPLIED) 비율"
                        : "ops_apply_status 미기록 — 운영적용 상태 기록 도입 후 추적");
    }

    private long num(Object o) { return o == null ? 0 : ((Number) o).longValue(); }
}
