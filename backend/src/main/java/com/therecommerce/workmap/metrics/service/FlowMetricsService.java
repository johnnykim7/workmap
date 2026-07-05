package com.therecommerce.workmap.metrics.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.agile.domain.Sprint;
import com.therecommerce.workmap.agile.mapper.SprintMapper;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.metrics.dto.FlowMetricsDtos;
import com.therecommerce.workmap.metrics.mapper.MetricsMapper;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 흐름·예측 지표 서비스 (CR-043, 2차) — Cycle Time·CFD·Say-Do·Monte Carlo·현장검증률.
 * 흐름기반(F): 추세·형태로 건강 판단. 백분위(평균 아님). 가시성=MetricsService와 동일 가드.
 */
@Service
@RequiredArgsConstructor
public class FlowMetricsService {

    private final MetricsMapper metricsMapper;
    private final SprintMapper sprintMapper;
    private final ProjectMapper projectMapper;

    /** Monte Carlo 참조 이력(일). 기본 30일. */
    @Value("${workmap.metrics.forecast-history-days:30}")
    private int forecastHistoryDays;

    // ── 가시성 가드 ─────────────────────────────────────────────────
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

    // ── Cycle Time (WMP-HOME-006) ───────────────────────────────────
    @Transactional(readOnly = true)
    public FlowMetricsDtos.CycleTime cycleTime(Long projectId, Long viewerId) {
        requireVisible(projectId, viewerId);
        List<FlowMetricsDtos.CycleTimePoint> points = metricsMapper.cycleTimePoints(projectId);
        List<Double> sorted = points.stream().map(FlowMetricsDtos.CycleTimePoint::getDays).sorted().toList();
        double p50 = percentile(sorted, 0.50);
        double p85 = percentile(sorted, 0.85);
        return new FlowMetricsDtos.CycleTime(points.size(), round1(p50), round1(p85), points);
    }

    /** 백분위(선형 보간 없이 nearest-rank 근사 — 소표본 안정). */
    private double percentile(List<Double> sorted, double p) {
        if (sorted.isEmpty()) return 0;
        int idx = (int) Math.ceil(p * sorted.size()) - 1;
        idx = Math.max(0, Math.min(sorted.size() - 1, idx));
        return sorted.get(idx);
    }

    private double round1(double v) { return Math.round(v * 10.0) / 10.0; }

    // ── CFD (WMP-HOME-007) ──────────────────────────────────────────
    @Transactional(readOnly = true)
    public FlowMetricsDtos.Cfd cfd(Long projectId, Long viewerId, LocalDate from, LocalDate to) {
        requireVisible(projectId, viewerId);
        if (from == null) from = LocalDate.now().minusDays(30);
        if (to == null) to = LocalDate.now();
        List<Map<String, Object>> rows = metricsMapper.cfdBands(projectId, from, to);
        // 날짜별 밴드 조립(LinkedHashMap로 날짜 순서 보존).
        Map<LocalDate, List<FlowMetricsDtos.StatusCount>> byDate = new LinkedHashMap<>();
        for (Map<String, Object> r : rows) {
            LocalDate d = toLocalDate(r.get("date"));
            String status = (String) r.get("commonStatus");
            int count = ((Number) r.get("count")).intValue();
            byDate.computeIfAbsent(d, k -> new ArrayList<>())
                  .add(new FlowMetricsDtos.StatusCount(status, count));
        }
        List<FlowMetricsDtos.CfdDay> days = byDate.entrySet().stream()
                .map(e -> new FlowMetricsDtos.CfdDay(e.getKey(), e.getValue()))
                .toList();
        return new FlowMetricsDtos.Cfd(from, to, days);
    }

    private LocalDate toLocalDate(Object o) {
        if (o instanceof java.sql.Date d) return d.toLocalDate();
        if (o instanceof LocalDate d) return d;
        return LocalDate.parse(o.toString());
    }

    // ── 현장 검증률 (WMP-HOME-010) ──────────────────────────────────
    @Transactional(readOnly = true)
    public FlowMetricsDtos.FieldVerification fieldVerification(Long projectId, Long viewerId) {
        requireVisible(projectId, viewerId);
        FlowMetricsDtos.FieldVerification s = metricsMapper.fieldVerificationStats(projectId);
        int rate = s.total() == 0 ? 0 : (int) Math.round(100.0 * s.passed() / s.total());
        return new FlowMetricsDtos.FieldVerification(s.total(), s.passed(), s.failed(), s.partial(), rate);
    }

    // ── Say-Do Ratio (WMP-HOME-008) ────────────────────────────────
    @Transactional(readOnly = true)
    public FlowMetricsDtos.SayDo sayDo(Long projectId, Long viewerId) {
        requireVisible(projectId, viewerId);
        List<Sprint> sprints = sprintMapper.findByProject(projectId);
        List<FlowMetricsDtos.SayDoSprint> out = new ArrayList<>();
        for (Sprint sp : sprints) {
            FlowMetricsDtos.SayDoCommitment c = metricsMapper.doneAmongCommitted(sp.getId());
            if (c == null) continue;  // 동결 커밋 없음(시작 전 or 구 스프린트) → 제외
            int committedPts = c.committedPoints();
            int donePts = c.donePoints();
            int sayDoPct = committedPts == 0 ? 0 : (int) Math.round(100.0 * donePts / committedPts);
            out.add(new FlowMetricsDtos.SayDoSprint(
                    sp.getId(), sp.getName(),
                    committedPts, c.committedItems(),
                    donePts, c.doneItems(),
                    sayDoPct,
                    0  // 스코프 변경률: 시작후 추가/제거 추적은 3차(현재 0 placeholder)
            ));
        }
        return new FlowMetricsDtos.SayDo(out);
    }

    // ── Monte Carlo 완료 예측 (WMP-HOME-014) ────────────────────────
    @Transactional(readOnly = true)
    public FlowMetricsDtos.Forecast forecast(Long projectId, Long viewerId, int targetDays) {
        requireVisible(projectId, viewerId);
        List<Integer> daily = metricsMapper.dailyThroughput(projectId, forecastHistoryDays);
        // 완료 이력이 없는 날은 0으로 채워야 하나, 여기선 실적일만 표본 → 평균에 반영.
        // historyDays 전체 일수를 분모로 써서 "완료 없는 날"도 0 표본에 포함(현실적 처리량).
        int totalDone = daily.stream().mapToInt(Integer::intValue).sum();
        double avgPerDay = forecastHistoryDays == 0 ? 0 : (double) totalDone / forecastHistoryDays;

        // 간이 Monte Carlo: 일별 표본(실적일 + 0 패딩)에서 targetDays만큼 리샘플링 반복.
        // 결정론적 재현을 위해 표본 순환(무작위 없이) — 분포는 표본 변동성 근사.
        int td = targetDays <= 0 ? 14 : targetDays;
        List<Integer> samples = new ArrayList<>(daily);
        int zeroDays = Math.max(0, forecastHistoryDays - daily.size());
        for (int i = 0; i < zeroDays; i++) samples.add(0);
        if (samples.isEmpty()) samples.add(0);

        List<Integer> sims = new ArrayList<>();
        int trials = 500;
        for (int t = 0; t < trials; t++) {
            int sum = 0;
            for (int d = 0; d < td; d++) {
                sum += samples.get((t * 31 + d * 7) % samples.size());  // 결정론적 의사난수 인덱싱
            }
            sims.add(sum);
        }
        sims.sort(Integer::compareTo);

        List<FlowMetricsDtos.ForecastPoint> dist = new ArrayList<>();
        for (int conf : new int[]{50, 70, 85, 95}) {
            // 신뢰도 conf% = "적어도 이만큼 완료"의 보수적 하한 → (100-conf) 백분위
            int idx = (int) Math.floor((100 - conf) / 100.0 * (sims.size() - 1));
            idx = Math.max(0, Math.min(sims.size() - 1, idx));
            dist.add(new FlowMetricsDtos.ForecastPoint(conf, sims.get(idx)));
        }
        return new FlowMetricsDtos.Forecast(forecastHistoryDays, round1(avgPerDay), td, dist);
    }
}
