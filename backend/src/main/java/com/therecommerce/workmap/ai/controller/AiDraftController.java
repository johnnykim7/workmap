package com.therecommerce.workmap.ai.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.ai.dto.AiDraftDtos;
import com.therecommerce.workmap.ai.service.AiDraftService;
import com.therecommerce.workmap.common.security.WmpAuthz;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AI 업무 초안 API(WMP-WI-019, CR-050, T3-2 §F4). 백로그에서 서술 → aimbase → draft work_item.
 * 쓰기(생성·확정·버리기)는 WRITER(VIEWER 제외, CR-031), 조회는 인증 사용자.
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/ai-drafts")
@RequiredArgsConstructor
public class AiDraftController {

    private final AiDraftService aiDraftService;

    @PreAuthorize(WmpAuthz.WRITER)
    @PostMapping
    public ResponseDto<AiDraftDtos.CreateResult> create(
            @PathVariable Long projectId,
            @Valid @RequestBody AiDraftDtos.CreateRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(aiDraftService.create(projectId, req, userId));
    }

    @GetMapping
    public ResponseDto<List<WorkItemDtos.Response>> list(@PathVariable Long projectId) {
        return ResponseDto.success(aiDraftService.list(projectId));
    }

    @PreAuthorize(WmpAuthz.WRITER)
    @PostMapping("/confirm")
    public ResponseDto<AiDraftDtos.CountResult> confirm(
            @PathVariable Long projectId,
            @RequestBody(required = false) AiDraftDtos.ConfirmRequest req) {
        return ResponseDto.success(aiDraftService.confirm(projectId, req));
    }

    @PreAuthorize(WmpAuthz.WRITER)
    @DeleteMapping
    public ResponseDto<AiDraftDtos.CountResult> discardAll(@PathVariable Long projectId) {
        return ResponseDto.success(aiDraftService.discardAll(projectId));
    }
}
