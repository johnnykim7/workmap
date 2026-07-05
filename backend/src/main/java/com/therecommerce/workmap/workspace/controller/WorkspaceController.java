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

    /** 내가 속한 WS만 (BIZ-112, WMP-WS-008 선택 가능 목록). */
    @GetMapping
    public ResponseDto<List<WorkspaceDtos.Response>> list(@AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(workspaceService.list(userId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<WorkspaceDtos.Response> create(
            @Valid @RequestBody WorkspaceDtos.CreateRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(workspaceService.create(req, userId));
    }

    /** 상세 — 비멤버 403(BIZ-112). */
    @GetMapping("/{id}")
    public ResponseDto<WorkspaceDtos.Response> get(
            @PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(workspaceService.get(id, userId));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<WorkspaceDtos.Response> update(
            @PathVariable Long id, @Valid @RequestBody WorkspaceDtos.UpdateRequest req) {
        return ResponseDto.success(workspaceService.update(id, req));
    }

    /** WS 보관 (WMP-WS-011, 소프트 동결). 전사 Admin만(POL-014). FSM 가드 경유. */
    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<WorkspaceDtos.Response> archive(@PathVariable Long id) {
        return ResponseDto.success(workspaceService.archive(id));
    }

    /** WS 보관 해제 (WMP-WS-011). 전사 Admin만(POL-014). */
    @PatchMapping("/{id}/unarchive")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<WorkspaceDtos.Response> unarchive(@PathVariable Long id) {
        return ResponseDto.success(workspaceService.unarchive(id));
    }

    // ── WS 멤버 관리 (WMP-WS-007, CR-018) — 전사 Admin만(POL-004) ──

    @GetMapping("/{id}/members")
    public ResponseDto<List<WorkspaceDtos.MemberResponse>> listMembers(@PathVariable Long id) {
        return ResponseDto.success(workspaceService.listMembers(id));
    }

    @PostMapping("/{id}/members")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<Void> addMember(
            @PathVariable Long id, @Valid @RequestBody WorkspaceDtos.AddMemberRequest req) {
        workspaceService.addMember(id, req.userId());
        return ResponseDto.success(null);
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        workspaceService.removeMember(id, userId);
        return ResponseDto.success(null);
    }
}
