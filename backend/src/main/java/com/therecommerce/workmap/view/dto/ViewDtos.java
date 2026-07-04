package com.therecommerce.workmap.view.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * 보기(타임라인/캘린더) DTO (T3-2 I, WMP-VIEW-002/003).
 * 타임라인=start~due 막대, 캘린더=기한(due_date) 기준 월별 배치. 모두 work_item 파생 뷰(BIZ-106).
 */
public final class ViewDtos {

    private ViewDtos() {}

    /** 타임라인/캘린더 공통 항목(work_item 파생). */
    public record TimelineItem(
            Long id,
            String key,
            String title,
            String issueType,
            String commonStatus,
            String priority,
            Long assigneeId,
            Long epicId,
            LocalDate startDate,
            LocalDate dueDate,
            int progress
    ) {}

    /**
     * 의존성 링크 한 행(WMP-VIEW-006, CR-035). 간트 화살표용 — 선행(source)→후행(target).
     * timeline 응답에 BLOCKS 방향만 병기(양방향 저장이라 BLOCKED_BY 짝은 중복이라 생략).
     */
    public record TimelineLink(
            Long sourceId,
            Long targetId,
            String linkType   // BLOCKS만 반환(CR-035)
    ) {}

    /**
     * 타임라인/로드맵 응답(WMP-VIEW-002·005·006): 일정 있는 항목의 막대 목록 + 의존성 링크 목록.
     * 간트는 전체 그래프(막대+선+크리티컬패스)가 한 번에 필요하므로 links를 병기한다(CR-035).
     */
    public record TimelineResponse(
            Long projectId,
            List<TimelineItem> items,
            List<TimelineLink> links
    ) {}

    /** 캘린더 한 날짜의 항목 묶음(기한 기준). */
    public record CalendarDay(
            LocalDate date,
            List<TimelineItem> items
    ) {}

    /** 캘린더 응답(WMP-VIEW-003): 지정 월의 due_date별 묶음. */
    public record CalendarResponse(
            Long projectId,
            int year,
            int month,
            List<CalendarDay> days
    ) {}
}
