package com.therecommerce.workmap.view.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.view.dto.ViewDtos;
import com.therecommerce.workmap.view.mapper.ViewMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 보기(타임라인/캘린더) 서비스 (T3-2 I, WMP-VIEW-002/003).
 *
 * <p>가시성(BIZ-108): DashboardService와 동일 정책 — viewer가 볼 수 있는 프로젝트가 아니면
 * NOT_PROJECT_MEMBER로 차단(비공개 프로젝트 보호). 항목은 work_item 파생 뷰(BIZ-106)로,
 * 별도 테이블 없이 일정 컬럼으로 조회한다.
 */
@Service
@RequiredArgsConstructor
public class ViewService {

    private final ViewMapper viewMapper;
    private final ProjectMapper projectMapper;

    /**
     * 타임라인/로드맵(WMP-VIEW-002·005·006): 일정 있는 항목의 막대 목록 + 의존성 링크 목록.
     * 간트 고도화(CR-035)로 links를 병기 — BLOCKS 방향만(중복 화살표 방지). 크리티컬패스는 FE 파생.
     */
    @Transactional(readOnly = true)
    public ViewDtos.TimelineResponse timeline(Long projectId, Long viewerId) {
        assertVisible(projectId, viewerId);
        return new ViewDtos.TimelineResponse(
                projectId,
                viewMapper.timeline(projectId),
                viewMapper.timelineLinks(projectId));
    }

    /**
     * 캘린더(WMP-VIEW-003): 지정 월(year/month)의 기한 기준 항목을 날짜별로 묶는다.
     * year/month 미지정 시 caller가 현재 월을 넘긴다(Clock 의존은 컨트롤러/호출부에서 결정).
     */
    @Transactional(readOnly = true)
    public ViewDtos.CalendarResponse calendar(Long projectId, int year, int month, Long viewerId) {
        assertVisible(projectId, viewerId);
        if (month < 1 || month > 12) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "month는 1~12 사이여야 합니다.");
        }
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to = from.withDayOfMonth(from.lengthOfMonth());

        List<ViewDtos.TimelineItem> items = viewMapper.calendar(projectId, from, to);
        // due_date 기준 날짜별 그룹(입력이 due_date ASC 정렬이라 LinkedHashMap으로 순서 유지)
        Map<LocalDate, List<ViewDtos.TimelineItem>> byDate = new LinkedHashMap<>();
        for (ViewDtos.TimelineItem item : items) {
            byDate.computeIfAbsent(item.dueDate(), d -> new java.util.ArrayList<>()).add(item);
        }
        List<ViewDtos.CalendarDay> days = byDate.entrySet().stream()
                .map(e -> new ViewDtos.CalendarDay(e.getKey(), e.getValue()))
                .toList();
        return new ViewDtos.CalendarResponse(projectId, year, month, days);
    }

    /** 가시성 가드(BIZ-108): 프로젝트 존재 + viewer가 볼 수 있는지(대시보드와 동일). */
    private void assertVisible(Long projectId, Long viewerId) {
        if (projectMapper.findById(projectId) == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        boolean visible = projectMapper.findVisible(viewerId, null, null, null, true)
                .stream().map(Project::getId).anyMatch(projectId::equals);
        if (!visible) {
            throw new BusinessException(WmpErrorCode.NOT_PROJECT_MEMBER);
        }
    }
}
