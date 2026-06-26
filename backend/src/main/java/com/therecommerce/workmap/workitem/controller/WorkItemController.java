package com.therecommerce.workmap.workitem.controller;

import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.service.WorkItemBulkService;
import com.therecommerce.workmap.workitem.service.WorkItemQueryService;
import com.therecommerce.workmap.workitem.service.WorkItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * 업무 항목 API (T3-2 F). 단일 테이블 CRUD + 통합 목록 + 벌크 편집 +
 * 상태/담당자/유형전환/측정/스프린트 전용 PATCH. 상태 변경은 반드시 FSM 가드 경유(/status). 인증 필요(🔒).
 */
@RestController
@RequestMapping("/api/v1/work-items")
@RequiredArgsConstructor
public class WorkItemController {

    private final WorkItemService workItemService;
    private final WorkItemQueryService workItemQueryService;
    private final WorkItemBulkService workItemBulkService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseDto<WorkItemDtos.Response> create(
            @Valid @RequestBody WorkItemDtos.CreateRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(workItemService.create(req, userId));
    }

    /** 통합 목록(WMP-VIEW-001·004) — 검색·필터·정렬·페이징·가시성(BIZ-108). */
    @GetMapping
    public ResponseDto<PageResponse<WorkItemDtos.Response>> search(
            WorkItemDtos.SearchParams params,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(
                workItemQueryService.search(params, new PageRequest(page, size), userId));
    }

    /** 벌크 편집(WMP-WI-015) — 다건 일괄 변경, 항목별 FSM 검증·실패 분리 보고(BLK-1/2). */
    @PatchMapping("/bulk")
    public ResponseDto<WorkItemDtos.BulkResult> bulk(
            @Valid @RequestBody WorkItemDtos.BulkRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(workItemBulkService.bulkUpdate(req, userId));
    }

    @GetMapping("/{id}")
    public ResponseDto<WorkItemDtos.Response> get(@PathVariable Long id) {
        return ResponseDto.success(workItemService.get(id));
    }

    @PatchMapping("/{id}")
    public ResponseDto<WorkItemDtos.Response> update(
            @PathVariable Long id,
            @Valid @RequestBody WorkItemDtos.UpdateRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(workItemService.update(id, req, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseDto<Void> delete(@PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        workItemService.softDelete(id, userId);
        return ResponseDto.success(null);
    }

    @PostMapping("/{id}/subtasks")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseDto<WorkItemDtos.Response> createSubtask(
            @PathVariable Long id,
            @Valid @RequestBody WorkItemDtos.CreateSubtaskRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(workItemService.createSubtask(id, req, userId));
    }

    @PatchMapping("/{id}/status")
    public ResponseDto<WorkItemDtos.Response> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody WorkItemDtos.ChangeStatusRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(workItemService.changeStatus(id, req, userId));
    }

    @PatchMapping("/{id}/assignee")
    public ResponseDto<WorkItemDtos.Response> changeAssignee(
            @PathVariable Long id,
            @RequestBody WorkItemDtos.ChangeAssigneeRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(workItemService.changeAssignee(id, req, userId));
    }

    @PatchMapping("/{id}/convert")
    public ResponseDto<WorkItemDtos.Response> convert(
            @PathVariable Long id,
            @Valid @RequestBody WorkItemDtos.ConvertRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(workItemService.convert(id, req, userId));
    }

    @PatchMapping("/{id}/measure")
    public ResponseDto<WorkItemDtos.Response> updateMeasure(
            @PathVariable Long id,
            @RequestBody WorkItemDtos.MeasureRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(workItemService.updateMeasure(id, req, userId));
    }

    @PatchMapping("/{id}/sprint")
    public ResponseDto<WorkItemDtos.Response> changeSprint(
            @PathVariable Long id,
            @RequestBody WorkItemDtos.ChangeSprintRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(workItemService.changeSprint(id, req.sprintId(), userId));
    }
}
