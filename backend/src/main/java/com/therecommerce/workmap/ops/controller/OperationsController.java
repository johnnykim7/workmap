package com.therecommerce.workmap.ops.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.ops.dto.OpsDtos;
import com.therecommerce.workmap.ops.service.OperationsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/** 운영 실행 API (T3-2 H). 처리량(OPS-002) / 현장이슈→백로그 전환(OPS-003). 인증 필요(🔒). */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class OperationsController {

    private final OperationsService operationsService;

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
}
