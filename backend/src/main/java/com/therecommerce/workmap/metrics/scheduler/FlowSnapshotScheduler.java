package com.therecommerce.workmap.metrics.scheduler;

import com.therecommerce.workmap.metrics.dto.FlowMetricsDtos;
import com.therecommerce.workmap.metrics.mapper.MetricsMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

/**
 * CFD 일별 스냅샷 스케줄러 (CR-043, WMP-HOME-007). 매일 상태별 항목 분포를 flow_snapshots에 적재.
 * burndown 스케줄러(CR-012)와 동일 패턴 — @Scheduled cron(KST), 프로젝트별 실패 격리, UNIQUE upsert 멱등.
 */
@Component
@RequiredArgsConstructor
public class FlowSnapshotScheduler {

    private static final Logger log = LoggerFactory.getLogger(FlowSnapshotScheduler.class);

    private final MetricsMapper metricsMapper;
    private final Clock clock;

    /** 매일 00:15 KST — 전 프로젝트의 당일 상태 분포 스냅샷(CFD 밴드 소스). */
    @Scheduled(cron = "0 15 0 * * *", zone = "Asia/Seoul")
    public void snapshotDaily() {
        LocalDate today = LocalDate.now(clock);
        List<Long> projectIds = metricsMapper.allActiveProjectIds();
        for (Long pid : projectIds) {
            try {
                List<FlowMetricsDtos.StatusCount> counts = metricsMapper.currentStatusCounts(pid);
                for (FlowMetricsDtos.StatusCount c : counts) {
                    metricsMapper.upsertFlowSnapshot(pid, today, c.commonStatus(), c.count());
                }
            } catch (Exception e) {
                log.warn("CFD 스냅샷 실패 project={} : {}", pid, e.getMessage());
            }
        }
    }
}
