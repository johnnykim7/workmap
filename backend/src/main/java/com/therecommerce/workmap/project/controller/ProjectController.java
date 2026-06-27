package com.therecommerce.workmap.project.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.project.dto.ProjectDtos;
import com.therecommerce.workmap.project.dto.ProjectSummary;
import com.therecommerce.workmap.project.dto.ProjectTabDtos;
import com.therecommerce.workmap.project.service.ProjectService;
import com.therecommerce.workmap.project.service.ProjectTabService;
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
    private final ProjectTabService projectTabService;

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

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','OWNER')")
    public ResponseDto<ProjectDtos.Response> update(
            @PathVariable Long id, @Valid @RequestBody ProjectDtos.UpdateRequest req) {
        return ResponseDto.success(projectService.update(id, req));
    }

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','OWNER')")
    public ResponseDto<ProjectDtos.Response> archive(@PathVariable Long id) {
        return ResponseDto.success(projectService.archive(id));
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

    // ─────────────── 탭 메뉴(Jira식, CR-020) ───────────────

    /** 탭 메뉴 데이터(폴백 적용 표시명·기본탭). 이동·제거·기본값은 PATCH /projects/{id}. */
    @GetMapping("/{id}/tabs")
    public ResponseDto<ProjectTabDtos.TabsResponse> tabs(@PathVariable Long id) {
        return ResponseDto.success(projectTabService.getTabs(id));
    }

    /** 탭 이름 바꾸기(프로젝트별 오버라이드). */
    @PutMapping("/{id}/tabs/{code}/label")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','OWNER')")
    public ResponseDto<Void> renameTab(
            @PathVariable Long id, @PathVariable String code,
            @Valid @RequestBody ProjectTabDtos.RenameRequest req) {
        projectTabService.rename(id, code, req.label());
        return ResponseDto.success(null);
    }

    /** 탭 이름 되돌리기(기본값 폴백). */
    @DeleteMapping("/{id}/tabs/{code}/label")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','OWNER')")
    public ResponseDto<Void> resetTabLabel(
            @PathVariable Long id, @PathVariable String code) {
        projectTabService.resetLabel(id, code);
        return ResponseDto.success(null);
    }
}
