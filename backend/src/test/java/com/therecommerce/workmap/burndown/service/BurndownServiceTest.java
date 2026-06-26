package com.therecommerce.workmap.burndown.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.agile.domain.Sprint;
import com.therecommerce.workmap.burndown.domain.BurndownSnapshot;
import com.therecommerce.workmap.burndown.dto.BurndownDtos;
import com.therecommerce.workmap.burndown.mapper.BurndownMapper;
import com.therecommerce.workmap.agile.mapper.SprintMapper;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * BurndownService 단위테스트 (CR-012, WMP-AGL-006). 스냅샷 적재(잔여/완료 집계) + 조회(번다운/벨로시티).
 */
@ExtendWith(MockitoExtension.class)
class BurndownServiceTest {

    @Mock BurndownMapper burndownMapper;
    @Mock SprintMapper sprintMapper;
    @Mock WorkItemMapper workItemMapper;

    BurndownService service;

    @BeforeEach
    void setUp() {
        service = new BurndownService(burndownMapper, sprintMapper, workItemMapper);
    }

    private WorkItem item(int sp) {
        return WorkItem.builder().storyPoints(sp).build();
    }

    @Test
    @DisplayName("START 스냅샷: 기준선 total 고정·remaining=total·completed=0(null 포인트는 0)")
    void 시작스냅샷_기준선고정() {
        when(workItemMapper.findBySprint(1L)).thenReturn(List.of(
                item(3), item(5), WorkItem.builder().storyPoints(null).build()));  // null=0

        service.snapshotStart(1L, LocalDate.of(2026, 6, 26));

        ArgumentCaptor<BurndownSnapshot> cap = ArgumentCaptor.forClass(BurndownSnapshot.class);
        verify(burndownMapper).upsert(cap.capture());
        BurndownSnapshot s = cap.getValue();
        assertThat(s.getSnapshotType()).isEqualTo("START");
        assertThat(s.getTotalPoints()).isEqualTo(8);
        assertThat(s.getRemainingPoints()).isEqualTo(8);
        assertThat(s.getCompletedPoints()).isZero();
    }

    @Test
    @DisplayName("DAILY 스냅샷: 잔여=미완료 합, 완료=완료 합, total은 START 기준선 유지")
    void 일별스냅샷_잔여완료집계() {
        when(workItemMapper.findUnfinishedBySprint(1L)).thenReturn(List.of(item(2), item(3)));  // 5
        when(workItemMapper.findDoneBySprint(1L)).thenReturn(List.of(item(8)));                  // 8
        // 기준선 START 스냅샷(total=13) 존재
        when(burndownMapper.findBySprint(1L)).thenReturn(List.of(
                BurndownSnapshot.builder().snapshotType("START").totalPoints(13).build()));

        service.snapshotDaily(1L, LocalDate.of(2026, 6, 27));

        ArgumentCaptor<BurndownSnapshot> cap = ArgumentCaptor.forClass(BurndownSnapshot.class);
        verify(burndownMapper).upsert(cap.capture());
        BurndownSnapshot s = cap.getValue();
        assertThat(s.getSnapshotType()).isEqualTo("DAILY");
        assertThat(s.getRemainingPoints()).isEqualTo(5);
        assertThat(s.getCompletedPoints()).isEqualTo(8);
        assertThat(s.getTotalPoints()).isEqualTo(13);   // 기준선 유지(현재 합 13과 우연히 같지 않게 검증되도록)
    }

    @Test
    @DisplayName("DAILY 스냅샷: START 기준선 없으면 현재 합(remaining+completed)으로 보정")
    void 일별스냅샷_기준선없음_현재합보정() {
        when(workItemMapper.findUnfinishedBySprint(1L)).thenReturn(List.of(item(4)));
        when(workItemMapper.findDoneBySprint(1L)).thenReturn(List.of(item(6)));
        when(burndownMapper.findBySprint(1L)).thenReturn(List.of());  // START 없음

        service.snapshotDaily(1L, LocalDate.of(2026, 6, 27));

        ArgumentCaptor<BurndownSnapshot> cap = ArgumentCaptor.forClass(BurndownSnapshot.class);
        verify(burndownMapper).upsert(cap.capture());
        assertThat(cap.getValue().getTotalPoints()).isEqualTo(10);   // 4+6
    }

    @Test
    @DisplayName("번다운 조회: FUTURE(미시작) 스프린트는 SPRINT_NOT_STARTED 거부")
    void 번다운조회_미시작_거부() {
        when(sprintMapper.findById(1L)).thenReturn(Sprint.builder().id(1L).status("FUTURE").build());

        assertThatThrownBy(() -> service.burndown(1L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", WmpErrorCode.SPRINT_NOT_STARTED);
    }

    @Test
    @DisplayName("번다운 조회: 없는 스프린트는 SPRINT_NOT_FOUND")
    void 번다운조회_없음_NOT_FOUND() {
        when(sprintMapper.findById(9L)).thenReturn(null);

        assertThatThrownBy(() -> service.burndown(9L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", WmpErrorCode.SPRINT_NOT_FOUND);
    }

    @Test
    @DisplayName("번다운 조회: ACTIVE 스프린트는 스냅샷 시계열 + 기준선 total 반환")
    void 번다운조회_활성_시계열반환() {
        when(sprintMapper.findById(1L)).thenReturn(Sprint.builder().id(1L).status("ACTIVE").build());
        when(burndownMapper.findBySprint(1L)).thenReturn(List.of(
                BurndownSnapshot.builder().snapshotDate(LocalDate.of(2026, 6, 26))
                        .remainingPoints(13).completedPoints(0).totalPoints(13).snapshotType("START").build(),
                BurndownSnapshot.builder().snapshotDate(LocalDate.of(2026, 6, 27))
                        .remainingPoints(8).completedPoints(5).totalPoints(13).snapshotType("DAILY").build()));

        BurndownDtos.BurndownResponse res = service.burndown(1L);

        assertThat(res.totalPoints()).isEqualTo(13);
        assertThat(res.points()).hasSize(2);
        assertThat(res.points().get(1).remainingPoints()).isEqualTo(8);
        assertThat(res.points().get(1).completedPoints()).isEqualTo(5);
    }

    @Test
    @DisplayName("벨로시티: 완료 스프린트들의 completed_points 평균")
    void 벨로시티_완료평균() {
        when(burndownMapper.findCompletedByProject(5L)).thenReturn(List.of(
                BurndownSnapshot.builder().sprintId(1L).snapshotDate(LocalDate.of(2026, 6, 1))
                        .completedPoints(10).snapshotType("COMPLETE").build(),
                BurndownSnapshot.builder().sprintId(2L).snapshotDate(LocalDate.of(2026, 6, 15))
                        .completedPoints(20).snapshotType("COMPLETE").build()));

        BurndownDtos.VelocityResponse res = service.velocity(5L);

        assertThat(res.sprints()).hasSize(2);
        assertThat(res.averageVelocity()).isEqualTo(15.0);
    }

    @Test
    @DisplayName("벨로시티: 완료 스프린트 없으면 평균 0")
    void 벨로시티_없음_0() {
        when(burndownMapper.findCompletedByProject(5L)).thenReturn(List.of());

        BurndownDtos.VelocityResponse res = service.velocity(5L);

        assertThat(res.sprints()).isEmpty();
        assertThat(res.averageVelocity()).isZero();
    }
}
