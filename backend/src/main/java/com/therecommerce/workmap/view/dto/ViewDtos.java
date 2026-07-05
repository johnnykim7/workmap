package com.therecommerce.workmap.view.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
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

    /**
     * 프로젝트 첨부 집계 한 행(WMP-VIEW-007, CR-044). 파일 메타 + 소속 업무(키·요약) + 업로더 이름.
     * 첨부의 소속지는 개별 업무(WMP-WI-012)이고, 본 항목은 그것을 파일 관점으로 모아 보기 위한 조인 결과다.
     */
    public record ProjectAttachmentItem(
            Long id,
            String fileName,
            String filePath,
            Long fileSize,
            String contentType,
            OffsetDateTime createdAt,
            Long workItemId,
            String workItemKey,
            String workItemSummary,
            String uploaderName
    ) {}

    /** 프로젝트 첨부 집계 응답(WMP-VIEW-007): 프로젝트 내 전체 업무 첨부를 최신순으로 모은 목록. */
    public record ProjectAttachmentsResponse(
            Long projectId,
            List<ProjectAttachmentItem> items
    ) {}
}
