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

    /** 타임라인/로드맵 응답(WMP-VIEW-002): 일정이 있는 항목의 막대 목록. */
    public record TimelineResponse(
            Long projectId,
            List<TimelineItem> items
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
