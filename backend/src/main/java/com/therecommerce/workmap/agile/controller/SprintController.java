package com.therecommerce.workmap.agile.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.agile.dto.SprintDtos;
import com.therecommerce.workmap.agile.service.SprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 애자일 — 스프린트/백로그 API (T3-2 G). 인증 필요(🔒).
 * 경로가 프로젝트 하위(생성/목록/백로그)와 스프린트 단위(시작/완료)로 나뉜다.
 */
@RestController
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @GetMapping("/api/v1/projects/{projectId}/backlog")
    public ResponseDto<SprintDtos.BacklogResponse> backlog(@PathVariable Long projectId) {
        return ResponseDto.success(sprintService.backlog(projectId));
    }

    @GetMapping("/api/v1/projects/{projectId}/sprints")
    public ResponseDto<List<SprintDtos.Response>> list(@PathVariable Long projectId) {
        return ResponseDto.success(sprintService.list(projectId));
    }

    @PostMapping("/api/v1/projects/{projectId}/sprints")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseDto<SprintDtos.Response> create(
            @PathVariable Long projectId,
            @Valid @RequestBody SprintDtos.CreateRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(sprintService.create(projectId, req, userId));
    }

    @PostMapping("/api/v1/sprints/{sprintId}/start")
    public ResponseDto<SprintDtos.Response> start(
            @PathVariable Long sprintId,
            @RequestBody(required = false) SprintDtos.StartRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(sprintService.start(sprintId, req, userId));
    }

    @PostMapping("/api/v1/sprints/{sprintId}/complete")
    public ResponseDto<SprintDtos.CompleteResult> complete(
            @PathVariable Long sprintId,
            @RequestBody(required = false) SprintDtos.CompleteRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(sprintService.complete(sprintId, req, userId));
    }
}
