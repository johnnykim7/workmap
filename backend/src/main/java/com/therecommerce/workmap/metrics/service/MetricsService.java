package com.therecommerce.workmap.metrics.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.metrics.dto.MetricsDtos;
import com.therecommerce.workmap.metrics.mapper.MetricsMapper;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 프로젝트 건강 지표 서비스 (CR-043, WMP-HOME-004~011) — 1차(예외축).
 *
 * <p>"잘 됨"을 다축으로 증명. 예외기반(E)=비면 건강 / 흐름기반(F)=추세. 막힘=flagged(CR-040).
 * 가시성(BIZ-108): DashboardService.report와 동일 가드(findVisible + NOT_PROJECT_MEMBER).
 * 종합 건강 판정(WMP-HOME-004)은 축별 지표를 조합해 스코어·신호등 산출.
 *
 * <p>1차 구현 범위: Work Item Age(A축)·재작업률(D축)·담당자 과부하(E축) + 종합 판정.
 * 2·3차(Cycle Time 백분위·CFD·Say-Do·Monte Carlo·EVM·팀간 대기)는 설계 문서에 정의, 구현 후속.
 */
@Service
@RequiredArgsConstructor
public class MetricsService {

    private final MetricsMapper metricsMapper;
    private final ProjectMapper projectMapper;

    /** Work Item Age SLE(임계일). 초과 시 위험. 기본 10일. */
    @Value("${workmap.metrics.sle-days:10}")
    private int sleDays;

    /** 재작업률 위험 임계(%). 이 이상이면 품질축 경고. 기본 10%. */
    @Value("${workmap.metrics.rework-threshold-pct:10}")
    private int reworkThresholdPct;

    // ── 가시성 가드 (report와 동일) ─────────────────────────────────
    private Project requireVisibleProject(Long projectId, Long viewerId) {
        Project project = projectMapper.findById(projectId);
        if (project == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        boolean visible = projectMapper.findVisible(viewerId, null, null, null, true)
                .stream().anyMatch(p -> p.getId().equals(projectId));
        if (!visible) {
            throw new BusinessException(WmpErrorCode.NOT_PROJECT_MEMBER);
        }
        return project;
    }

    // ── Work Item Age (WMP-HOME-005, E, A축) ────────────────────────
    @Transactional(readOnly = true)
    public MetricsDtos.Aging aging(Long projectId, Long viewerId) {
        requireVisibleProject(projectId, viewerId);
        long blocked = metricsMapper.blockedCount(projectId);
        long overSle = metricsMapper.overSleCount(projectId, sleDays);
        List<MetricsDtos.AgingItem> items = metricsMapper.agingItems(projectId, sleDays);
        return new MetricsDtos.Aging(sleDays, blocked, overSle, items);
    }

    // ── 재작업 · Reopen Rate (WMP-HOME-009, E, D축) ─────────────────
    @Transactional(readOnly = true)
    public MetricsDtos.Rework rework(Long projectId, Long viewerId) {
        requireVisibleProject(projectId, viewerId);
        long everDone = metricsMapper.everDoneCount(projectId);
        long reopened = metricsMapper.reopenedCount(projectId);
        int ratePct = everDone == 0 ? 0 : (int) Math.round(100.0 * reopened / everDone);
        List<MetricsDtos.ReopenItem> items = metricsMapper.reopenItems(projectId);
        return new MetricsDtos.Rework(everDone, reopened, ratePct, items);
    }

    // ── 담당자 과부하 (WMP-HOME-011, E, E축) ────────────────────────
    @Transactional(readOnly = true)
    public MetricsDtos.Workload workload(Long projectId, Long viewerId) {
        requireVisibleProject(projectId, viewerId);
        return new MetricsDtos.Workload(metricsMapper.workload(projectId));
    }

    // ── 종합 건강 판정 (WMP-HOME-004) ───────────────────────────────
    /**
     * 5축 중 1차 구현 3축(흐름·품질·팀)을 조합해 스코어·신호등 산출.
     * 예측·일정 축은 2·3차 지표 완성 후 편입(현재는 표기만·미평가).
     *
     * <p>축 판정 규칙(초기값, 설계 골격 기준 — 추후 조정):
     * <ul>
     *   <li>흐름(A): SLE 초과 항목이 있으면 WARN, 막힘이 있으면 CRIT, 없으면 OK.</li>
     *   <li>품질(D): 재작업률 &gt;= 임계면 CRIT, &gt;0면 WARN, 0이면 OK.</li>
     *   <li>팀(E): 위험(지연·막힘 동시 보유) 담당자 있으면 CRIT, 지연만 있으면 WARN, 없으면 OK.</li>
     * </ul>
     * 스코어 = 축별 (OK 100 / WARN 60 / CRIT 30) 평균.
     */
    @Transactional(readOnly = true)
    public MetricsDtos.Health health(Long projectId, Long viewerId) {
        Project project = requireVisibleProject(projectId, viewerId);

        long blocked = metricsMapper.blockedCount(projectId);
        long overSle = metricsMapper.overSleCount(projectId, sleDays);
        long everDone = metricsMapper.everDoneCount(projectId);
        long reopened = metricsMapper.reopenedCount(projectId);
        int reworkPct = everDone == 0 ? 0 : (int) Math.round(100.0 * reopened / everDone);
        List<MetricsDtos.WorkloadRow> loads = metricsMapper.workload(projectId);

        List<MetricsDtos.AxisHealth> axes = new ArrayList<>();

        // A. 흐름
        String flowStatus = blocked > 0 ? "CRIT" : (overSle > 0 ? "WARN" : "OK");
        String flowSummary = blocked > 0
                ? ("막힌 업무 " + blocked + "건")
                : (overSle > 0 ? ("정체(SLE " + sleDays + "일 초과) " + overSle + "건") : "멈춘 일 없음");
        axes.add(new MetricsDtos.AxisHealth("FLOW", "흐름", flowStatus, flowSummary));

        // D. 품질
        String qualStatus = reworkPct >= reworkThresholdPct ? "CRIT" : (reworkPct > 0 ? "WARN" : "OK");
        String qualSummary = reworkPct > 0
                ? ("재작업률 " + reworkPct + "% (기준 " + reworkThresholdPct + "%)")
                : "재작업 없음";
        axes.add(new MetricsDtos.AxisHealth("QUALITY", "품질", qualStatus, qualSummary));

        // E. 팀 부하
        long riskyLoads = loads.stream().filter(l -> l.getBlocked() > 0 && l.getDelayed() > 0).count();
        long warnLoads = loads.stream().filter(l -> l.getDelayed() > 0 || l.getBlocked() > 0).count();
        String teamStatus = riskyLoads > 0 ? "CRIT" : (warnLoads > 0 ? "WARN" : "OK");
        String teamSummary = riskyLoads > 0
                ? ("과부하(지연·막힘 동시) 담당자 " + riskyLoads + "명")
                : (warnLoads > 0 ? ("주의 담당자 " + warnLoads + "명") : "부하 균형");
        axes.add(new MetricsDtos.AxisHealth("TEAM", "팀 부하", teamStatus, teamSummary));

        int score = (int) Math.round(axes.stream()
                .mapToInt(a -> switch (a.status()) {
                    case "OK" -> 100;
                    case "WARN" -> 60;
                    default -> 30;
                })
                .average().orElse(100));

        String verdict = score >= 85 ? "대체로 순조로움"
                : score >= 60 ? "주의 필요"
                : "위험";

        return new MetricsDtos.Health(projectId, project.getName(), score, verdict, axes);
    }
}
