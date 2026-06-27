package com.therecommerce.workmap.dashboard.controller;

import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.dashboard.dto.DashboardDtos;
import com.therecommerce.workmap.dashboard.service.DashboardService;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 회사홈/보고 API (T3-2 G, WMP-HOME-001~003). 인증 필요(🔒).
 * 막힘/지연/미배정 목록·지표는 전사(가시성 필터) 기준이며 {@code ?projectId=}로 프로젝트 단위 축소 가능.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /** 막힌 업무 목록(BLOCKED). workspaceId 지정 시 그 WS로 좁힘(CR-018). */
    @GetMapping("/dashboard/blocked")
    public ResponseDto<PageResponse<WorkItemDtos.Response>> blocked(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(
                dashboardService.list("BLOCKED", projectId, workspaceId, new PageRequest(page, size), userId));
    }

    /** 지연 업무 목록(기한 초과 미완료, POL-002). */
    @GetMapping("/dashboard/delayed")
    public ResponseDto<PageResponse<WorkItemDtos.Response>> delayed(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(
                dashboardService.list("DELAYED", projectId, workspaceId, new PageRequest(page, size), userId));
    }

    /** 미배정 업무 목록(담당자 없음). */
    @GetMapping("/dashboard/unassigned")
    public ResponseDto<PageResponse<WorkItemDtos.Response>> unassigned(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(
                dashboardService.list("UNASSIGNED", projectId, workspaceId, new PageRequest(page, size), userId));
    }

    /** 지표 카드(진행/오늘마감/이번주/미배정/장기미변경, WMP-HOME-001). */
    @GetMapping("/dashboard/metrics")
    public ResponseDto<DashboardDtos.Metrics> metrics(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long workspaceId,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(dashboardService.metrics(projectId, workspaceId, userId));
    }

    /** 프로젝트 보고서(진행률/지연/막힘/담당자 부하, WMP-HOME-003). */
    @GetMapping("/projects/{id}/report")
    public ResponseDto<DashboardDtos.Report> report(
            @PathVariable Long id,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(dashboardService.report(id, userId));
    }
}
