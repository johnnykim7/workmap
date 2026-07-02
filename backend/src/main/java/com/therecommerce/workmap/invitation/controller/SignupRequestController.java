package com.therecommerce.workmap.invitation.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.invitation.dto.SignupDtos.ApproveRequest;
import com.therecommerce.workmap.invitation.dto.SignupDtos.RejectRequest;
import com.therecommerce.workmap.invitation.dto.SignupDtos.SignupRequestResponse;
import com.therecommerce.workmap.invitation.service.SignupRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 가입 요청 관리 API (WMP-AUTH-010, CR-032). 목록·승인·거절은 Admin 전용(POL-004).
 * 신청(공개)은 AuthController(/auth/signup-requests)가 담당.
 */
@RestController
@RequestMapping("/api/v1/signup-requests")
@RequiredArgsConstructor
public class SignupRequestController {

    private final SignupRequestService signupRequestService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<List<SignupRequestResponse>> list(@RequestParam(required = false) String status) {
        return ResponseDto.success(signupRequestService.list(status));
    }

    /** 승인 — 역할 지정 후 초대 발송. */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<Void> approve(@PathVariable Long id, @RequestBody(required = false) ApproveRequest req,
                                     @AuthUserInfo("userId") Long adminId) {
        signupRequestService.approve(id, req != null ? req : new ApproveRequest(null), adminId);
        return ResponseDto.success(null);
    }

    /** 거절 — 사유 선택. */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<Void> reject(@PathVariable Long id, @RequestBody(required = false) RejectRequest req,
                                    @AuthUserInfo("userId") Long adminId) {
        signupRequestService.reject(id, req != null ? req.reason() : null, adminId);
        return ResponseDto.success(null);
    }
}
