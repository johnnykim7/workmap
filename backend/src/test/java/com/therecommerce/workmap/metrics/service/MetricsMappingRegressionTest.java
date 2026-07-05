package com.therecommerce.workmap.metrics.service;

import com.therecommerce.workmap.agile.domain.Sprint;
import com.therecommerce.workmap.agile.mapper.SprintMapper;
import com.therecommerce.workmap.metrics.dto.AdvMetricsDtos;
import com.therecommerce.workmap.metrics.dto.FlowMetricsDtos;
import com.therecommerce.workmap.metrics.mapper.MetricsMapper;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Say-Do·팀간대기 매핑 회귀 테스트 (CR-043).
 *
 * <p>운영 실데이터 검증(2026-07-05) 중, 이 두 지표 경로에서 500이 발생했다:
 * <ul>
 *   <li>say-do: doneAmongCommitted 쿼리(5컬럼)를 8필드 record(SayDoSprint)에 자동매핑 →
 *       IndexOutOfBounds. → 5필드 전용 record(SayDoCommitment)로 분리.</li>
 *   <li>team-wait: TeamWaitItem.waitDays가 primitive long이라 ::bigint(Long)와 생성자 시그니처
 *       불일치 → NoSuchMethodException. → Long으로 변경.</li>
 * </ul>
 * flagged/commitment 데이터가 0이면 결과가 비어 이 경로가 실행된 적 없어 잠재됐던 버그.
 * 매퍼가 값이 있는 결과를 반환할 때 서비스가 정상 조립하는지(=record 시그니처 정합) 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class MetricsMappingRegressionTest {

    @Mock MetricsMapper metricsMapper;
    @Mock SprintMapper sprintMapper;
    @Mock ProjectMapper projectMapper;
    @InjectMocks FlowMetricsService flowService;
    @InjectMocks AdvMetricsService advService;

    private static final Long PID = 1L, VIEWER = 10L;

    @BeforeEach
    void setUp() {
        Project p = new Project();
        p.setId(PID);
        p.setName("카페24 검증");
        when(projectMapper.findById(PID)).thenReturn(p);
        when(projectMapper.findVisible(VIEWER, null, null, null, true)).thenReturn(List.of(p));
    }

    @Test
    void sayDo_동결커밋있음_5필드매핑_정상조립() {
        Sprint sp = new Sprint();
        sp.setId(11L);
        sp.setName("Sprint 2");
        when(sprintMapper.findByProject(PID)).thenReturn(List.of(sp));
        // doneAmongCommitted가 5필드 SayDoCommitment 반환(committed 10건/32p, done 8건/26p)
        when(metricsMapper.doneAmongCommitted(11L))
                .thenReturn(new FlowMetricsDtos.SayDoCommitment(11L, 32, 10, 26, 8));

        FlowMetricsDtos.SayDo result = flowService.sayDo(PID, VIEWER);

        assertThat(result.sprints()).hasSize(1);
        FlowMetricsDtos.SayDoSprint s = result.sprints().get(0);
        assertThat(s.committedPoints()).isEqualTo(32);
        assertThat(s.donePoints()).isEqualTo(26);
        assertThat(s.doneItems()).isEqualTo(8);
        assertThat(s.sayDoPct()).isEqualTo(81);   // 26/32 = 81%
    }

    @Test
    void sayDo_동결커밋없는스프린트_제외() {
        Sprint sp = new Sprint();
        sp.setId(13L);
        sp.setName("Sprint 4");
        when(sprintMapper.findByProject(PID)).thenReturn(List.of(sp));
        when(metricsMapper.doneAmongCommitted(13L)).thenReturn(null);  // 미시작 = 동결 없음

        FlowMetricsDtos.SayDo result = flowService.sayDo(PID, VIEWER);

        assertThat(result.sprints()).isEmpty();
    }

    @Test
    void teamWait_막힘항목있음_waitDaysLong_정상조립() {
        // ::bigint → Long 매핑. record가 Long waitDays를 받는지(생성자 시그니처 정합) 검증.
        AdvMetricsDtos.TeamWaitItem item = new AdvMetricsDtos.TeamWaitItem(
                87L, "RTN24-40", "카테고리 조회·내부 매핑",
                "카페24 앱스토어 심사팀 회신 대기", 10L);
        when(metricsMapper.teamWaitItems(PID)).thenReturn(List.of(item));

        AdvMetricsDtos.TeamWait result = advService.teamWait(PID, VIEWER);

        assertThat(result.structured()).isFalse();
        assertThat(result.waitingCount()).isEqualTo(1);
        assertThat(result.items().get(0).waitDays()).isEqualTo(10L);
    }
}
