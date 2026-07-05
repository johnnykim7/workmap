package com.therecommerce.workmap.view.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.view.dto.ViewDtos;
import com.therecommerce.workmap.view.service.ViewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Clock;
import java.time.LocalDate;

/**
 * 보기(타임라인/캘린더) API (T3-2 I, WMP-VIEW-002/003). 인증 필요(🔒). 프로젝트 단위 조회 —
 * 가시성(BIZ-108)은 ViewService가 강제(미가시 시 403). 항목은 work_item 파생 뷰(BIZ-106).
 */
@RestController
@RequiredArgsConstructor
public class ViewController {

    private final ViewService viewService;
    private final Clock clock;

    @GetMapping("/api/v1/projects/{projectId}/timeline")
    public ResponseDto<ViewDtos.TimelineResponse> timeline(
            @PathVariable Long projectId,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(viewService.timeline(projectId, userId));
    }

    /** 캘린더(기한 기준 월별). year/month 미지정 시 현재 월. */
    @GetMapping("/api/v1/projects/{projectId}/calendar")
    public ResponseDto<ViewDtos.CalendarResponse> calendar(
            @PathVariable Long projectId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @AuthUserInfo("userId") Long userId) {
        LocalDate today = LocalDate.now(clock);
        int y = year == null ? today.getYear() : year;
        int m = month == null ? today.getMonthValue() : month;
        return ResponseDto.success(viewService.calendar(projectId, y, m, userId));
    }

    /**
     * 프로젝트 첨부 집계(WMP-VIEW-007, CR-044): 프로젝트 내 전체 업무의 첨부를 파일 관점으로 모아 본다.
     * 조회 전용(GET) — VIEWER 포함 볼 수 있는 사용자 전원 허용. 가시성은 ViewService가 강제.
     */
    @GetMapping("/api/v1/projects/{projectId}/attachments")
    public ResponseDto<ViewDtos.ProjectAttachmentsResponse> attachments(
            @PathVariable Long projectId,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(viewService.attachments(projectId, userId));
    }
}
