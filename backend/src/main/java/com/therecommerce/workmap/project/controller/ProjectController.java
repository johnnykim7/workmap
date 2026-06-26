package com.therecommerce.workmap.project.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.project.dto.ProjectDtos;
import com.therecommerce.workmap.project.dto.ProjectSummary;
import com.therecommerce.workmap.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 프로젝트 API (T3-2 D). 생성/가시성/상태 변경은 Manager 이상(POL-004).
 * 목록·상세·요약은 가시성 권한 필터(BIZ-108)를 viewer 기준으로 적용.
 */
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseDto<List<ProjectDtos.Response>> list(
            @AuthUserInfo("userId") Long userId,
            @RequestParam(required = false) Long workspaceId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long templateId,
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        return ResponseDto.success(
                projectService.list(userId, workspaceId, status, templateId, includeArchived));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','OWNER')")
    public ResponseDto<ProjectDtos.Response> create(
            @Valid @RequestBody ProjectDtos.CreateRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(projectService.create(req, userId));
    }

    @GetMapping("/{id}")
    public ResponseDto<ProjectDtos.Response> get(
            @PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(projectService.get(id, userId));
    }

    @PatchMapping("/{id}/visibility")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','OWNER')")
    public ResponseDto<ProjectDtos.Response> changeVisibility(
            @PathVariable Long id, @Valid @RequestBody ProjectDtos.UpdateVisibilityRequest req) {
        return ResponseDto.success(projectService.changeVisibility(id, req.visibility()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','OWNER')")
    public ResponseDto<ProjectDtos.Response> changeStatus(
            @PathVariable Long id, @Valid @RequestBody ProjectDtos.ChangeStatusRequest req) {
        return ResponseDto.success(projectService.changeStatus(id, req.status()));
    }

    @GetMapping("/{id}/summary")
    public ResponseDto<ProjectSummary> summary(
            @PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(projectService.summary(id, userId));
    }
}
