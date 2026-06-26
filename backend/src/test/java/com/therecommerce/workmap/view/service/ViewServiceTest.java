package com.therecommerce.workmap.view.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.view.dto.ViewDtos;
import com.therecommerce.workmap.view.mapper.ViewMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * ViewService 단위테스트 (WMP-VIEW-002/003): 가시성 가드(BIZ-108)/캘린더 날짜별 그룹/잘못된 월 거부.
 */
@ExtendWith(MockitoExtension.class)
class ViewServiceTest {

    @Mock ViewMapper viewMapper;
    @Mock ProjectMapper projectMapper;
    ViewService service;

    @BeforeEach
    void setUp() {
        service = new ViewService(viewMapper, projectMapper);
    }

    private void visible(Long projectId) {
        when(projectMapper.findById(projectId)).thenReturn(Project.builder().id(projectId).build());
        when(projectMapper.findVisible(anyLong(), any(), any(), any(), anyBoolean()))
                .thenReturn(List.of(Project.builder().id(projectId).build()));
    }

    private ViewDtos.TimelineItem item(Long id, LocalDate due) {
        return new ViewDtos.TimelineItem(id, "WMP-" + id, "t" + id, "TASK", "TODO",
                "NORMAL", null, null, null, due, 0);
    }

    @Test
    @DisplayName("타임라인_가시프로젝트_항목반환")
    void 타임라인_성공() {
        visible(1L);
        when(viewMapper.timeline(1L)).thenReturn(List.of(item(1L, LocalDate.of(2026, 7, 10))));

        ViewDtos.TimelineResponse res = service.timeline(1L, 99L);

        assertThat(res.items()).hasSize(1);
    }

    @Test
    @DisplayName("타임라인_미가시프로젝트_차단됨")
    void 타임라인_미가시차단() {
        when(projectMapper.findById(1L)).thenReturn(Project.builder().id(1L).build());
        when(projectMapper.findVisible(anyLong(), any(), any(), any(), anyBoolean()))
                .thenReturn(List.of());   // 가시 목록 없음

        assertThatThrownBy(() -> service.timeline(1L, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.NOT_PROJECT_MEMBER);
    }

    @Test
    @DisplayName("타임라인_없는프로젝트_NOT_FOUND")
    void 타임라인_없는프로젝트() {
        when(projectMapper.findById(404L)).thenReturn(null);

        assertThatThrownBy(() -> service.timeline(404L, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.PROJECT_NOT_FOUND);
    }

    @Test
    @DisplayName("캘린더_같은날짜_묶임")
    void 캘린더_그룹() {
        visible(1L);
        LocalDate d1 = LocalDate.of(2026, 7, 10);
        LocalDate d2 = LocalDate.of(2026, 7, 20);
        when(viewMapper.calendar(eq(1L), any(), any()))
                .thenReturn(List.of(item(1L, d1), item(2L, d1), item(3L, d2)));

        ViewDtos.CalendarResponse res = service.calendar(1L, 2026, 7, 99L);

        assertThat(res.days()).hasSize(2);
        assertThat(res.days().get(0).date()).isEqualTo(d1);
        assertThat(res.days().get(0).items()).hasSize(2);   // 같은 날짜 2건 묶임
        assertThat(res.days().get(1).items()).hasSize(1);
    }

    @Test
    @DisplayName("캘린더_잘못된월_거부됨")
    void 캘린더_월검증() {
        visible(1L);

        assertThatThrownBy(() -> service.calendar(1L, 2026, 13, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.INVALID_REQUEST);
    }
}
