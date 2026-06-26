package com.therecommerce.workmap.approval.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.approval.dto.ApprovalDtos;
import com.therecommerce.workmap.approval.service.ApprovalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** 승인 API (T3-2 H1, WMP-OPS-006). 인증 필요(🔒). */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    /** 프로젝트 승인 목록(필터: decision PENDING/APPROVED/REJECTED). */
    @GetMapping("/projects/{projectId}/approvals")
    public ResponseDto<List<ApprovalDtos.Response>> listByProject(
            @PathVariable Long projectId,
            @RequestParam(required = false) String decision) {
        return ResponseDto.success(approvalService.listByProject(projectId, decision));
    }

    /** 항목별 승인 이력. */
    @GetMapping("/work-items/{id}/approvals")
    public ResponseDto<List<ApprovalDtos.Response>> listByWorkItem(@PathVariable Long id) {
        return ResponseDto.success(approvalService.listByWorkItem(id));
    }

    /** 승인/거부 처리. */
    @PostMapping("/approvals/{id}/decision")
    public ResponseDto<ApprovalDtos.Response> decide(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalDtos.DecisionRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(approvalService.decide(id, req, userId));
    }
}
