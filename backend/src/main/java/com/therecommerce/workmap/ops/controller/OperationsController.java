package com.therecommerce.workmap.ops.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.ops.dto.OpsDtos;
import com.therecommerce.workmap.ops.dto.VerificationDtos;
import com.therecommerce.workmap.ops.service.OperationsService;
import com.therecommerce.workmap.ops.service.VerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * 운영 실행 API (T3-2 H). 처리량(OPS-002) / 현장이슈→백로그 전환(OPS-003) /
 * 현장검증 기록(OPS-004, CR-012). 인증 필요(🔒).
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class OperationsController {

    private final OperationsService operationsService;
    private final VerificationService verificationService;

    @GetMapping("/projects/{projectId}/throughput")
    public ResponseDto<OpsDtos.ThroughputResponse> throughput(
            @PathVariable Long projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseDto.success(operationsService.throughput(projectId, from, to));
    }

    @PostMapping("/work-items/{id}/promote-to-backlog")
    public ResponseDto<OpsDtos.PromoteResult> promoteToBacklog(
            @PathVariable Long id,
            @RequestBody(required = false) OpsDtos.PromoteRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(operationsService.promoteToBacklog(id, req, userId));
    }

    /** 현장검증 기록 목록(WMP-OPS-004). */
    @GetMapping("/work-items/{id}/field-verifications")
    public ResponseDto<List<VerificationDtos.Response>> listVerifications(@PathVariable Long id) {
        return ResponseDto.success(verificationService.list(id));
    }

    /** 현장검증 기록 + (옵션) 발견 이슈 후속 업무 생성(WMP-OPS-004). */
    @PostMapping("/work-items/{id}/field-verifications")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseDto<VerificationDtos.CreateResult> createVerification(
            @PathVariable Long id,
            @Valid @RequestBody VerificationDtos.CreateRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(verificationService.create(id, req, userId));
    }
}
