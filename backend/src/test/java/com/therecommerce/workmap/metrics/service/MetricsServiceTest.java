package com.therecommerce.workmap.metrics.service;

import com.therecommerce.workmap.metrics.dto.MetricsDtos;
import com.therecommerce.workmap.metrics.mapper.MetricsMapper;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * 프로젝트 건강 지표 종합 판정 단위 테스트 (CR-043, WMP-HOME-004).
 * 축 판정 규칙(막힘→CRIT / 재작업임계→CRIT / 지연·막힘동시→CRIT)과 스코어 산출 검증.
 */
@ExtendWith(MockitoExtension.class)
class MetricsServiceTest {

    @Mock MetricsMapper metricsMapper;
    @Mock ProjectMapper projectMapper;
    @InjectMocks MetricsService service;

    private static final Long PID = 1L, VIEWER = 10L;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "sleDays", 10);
        ReflectionTestUtils.setField(service, "reworkThresholdPct", 10);
        Project p = new Project();
        p.setId(PID);
        p.setName("테스트");
        when(projectMapper.findById(PID)).thenReturn(p);
        when(projectMapper.findVisible(VIEWER, null, null, null, true)).thenReturn(List.of(p));
    }

    @Test
    void 막힘없음_재작업없음_부하균형_전체정상_스코어100() {
        when(metricsMapper.blockedCount(PID)).thenReturn(0L);
        when(metricsMapper.overSleCount(PID, 10)).thenReturn(0L);
        when(metricsMapper.everDoneCount(PID)).thenReturn(5L);
        when(metricsMapper.reopenedCount(PID)).thenReturn(0L);
        when(metricsMapper.workload(PID)).thenReturn(List.of());

        MetricsDtos.Health h = service.health(PID, VIEWER);

        assertThat(h.score()).isEqualTo(100);
        assertThat(h.verdict()).isEqualTo("대체로 순조로움");
        assertThat(h.axes()).allMatch(a -> a.status().equals("OK"));
    }

    @Test
    void 막힘있음_흐름축CRIT() {
        when(metricsMapper.blockedCount(PID)).thenReturn(2L);
        when(metricsMapper.overSleCount(PID, 10)).thenReturn(0L);
        when(metricsMapper.everDoneCount(PID)).thenReturn(5L);
        when(metricsMapper.reopenedCount(PID)).thenReturn(0L);
        when(metricsMapper.workload(PID)).thenReturn(List.of());

        MetricsDtos.Health h = service.health(PID, VIEWER);

        MetricsDtos.AxisHealth flow = h.axes().stream()
                .filter(a -> a.axis().equals("FLOW")).findFirst().orElseThrow();
        assertThat(flow.status()).isEqualTo("CRIT");
        assertThat(flow.summary()).contains("막힌 업무 2건");
        assertThat(h.score()).isLessThan(100);
    }

    @Test
    void 재작업률_임계이상_품질축CRIT() {
        when(metricsMapper.blockedCount(PID)).thenReturn(0L);
        when(metricsMapper.overSleCount(PID, 10)).thenReturn(0L);
        when(metricsMapper.everDoneCount(PID)).thenReturn(10L);
        when(metricsMapper.reopenedCount(PID)).thenReturn(2L);  // 20% >= 임계 10%
        when(metricsMapper.workload(PID)).thenReturn(List.of());

        MetricsDtos.Health h = service.health(PID, VIEWER);

        MetricsDtos.AxisHealth q = h.axes().stream()
                .filter(a -> a.axis().equals("QUALITY")).findFirst().orElseThrow();
        assertThat(q.status()).isEqualTo("CRIT");
        assertThat(q.summary()).contains("20%");
    }

    @Test
    void 지연막힘_동시보유_팀축CRIT() {
        when(metricsMapper.blockedCount(PID)).thenReturn(0L);
        when(metricsMapper.overSleCount(PID, 10)).thenReturn(0L);
        when(metricsMapper.everDoneCount(PID)).thenReturn(5L);
        when(metricsMapper.reopenedCount(PID)).thenReturn(0L);
        MetricsDtos.WorkloadRow risky = new MetricsDtos.WorkloadRow();
        risky.setAssigneeId(99L);
        risky.setInProgress(5);
        risky.setDelayed(2);
        risky.setBlocked(1);  // 지연·막힘 동시 = 위험
        when(metricsMapper.workload(PID)).thenReturn(List.of(risky));

        MetricsDtos.Health h = service.health(PID, VIEWER);

        MetricsDtos.AxisHealth team = h.axes().stream()
                .filter(a -> a.axis().equals("TEAM")).findFirst().orElseThrow();
        assertThat(team.status()).isEqualTo("CRIT");
        assertThat(team.summary()).contains("과부하");
    }

    @Test
    void 재작업률_분모0_경고아님() {
        when(metricsMapper.blockedCount(PID)).thenReturn(0L);
        when(metricsMapper.overSleCount(PID, 10)).thenReturn(0L);
        when(metricsMapper.everDoneCount(PID)).thenReturn(0L);  // 완료 이력 없음
        when(metricsMapper.reopenedCount(PID)).thenReturn(0L);
        when(metricsMapper.workload(PID)).thenReturn(List.of());

        MetricsDtos.Health h = service.health(PID, VIEWER);

        MetricsDtos.AxisHealth q = h.axes().stream()
                .filter(a -> a.axis().equals("QUALITY")).findFirst().orElseThrow();
        assertThat(q.status()).isEqualTo("OK");  // 0으로 나눔 방지 — 경고 아님
    }
}
