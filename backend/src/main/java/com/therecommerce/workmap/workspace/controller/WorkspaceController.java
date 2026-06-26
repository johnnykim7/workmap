package com.therecommerce.workmap.workspace.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.workspace.dto.WorkspaceDtos;
import com.therecommerce.workmap.workspace.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 워크스페이스 API (T3-2 C). 생성/수정은 Admin 전용(POL-004).
 */
@RestController
@RequestMapping("/api/v1/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @GetMapping
    public ResponseDto<List<WorkspaceDtos.Response>> list() {
        return ResponseDto.success(workspaceService.list());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<WorkspaceDtos.Response> create(
            @Valid @RequestBody WorkspaceDtos.CreateRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(workspaceService.create(req, userId));
    }

    @GetMapping("/{id}")
    public ResponseDto<WorkspaceDtos.Response> get(@PathVariable Long id) {
        return ResponseDto.success(workspaceService.get(id));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<WorkspaceDtos.Response> update(
            @PathVariable Long id, @Valid @RequestBody WorkspaceDtos.UpdateRequest req) {
        return ResponseDto.success(workspaceService.update(id, req));
    }
}
