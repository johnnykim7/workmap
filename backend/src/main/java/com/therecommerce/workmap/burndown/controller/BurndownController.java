package com.therecommerce.workmap.burndown.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.workmap.burndown.dto.BurndownDtos;
import com.therecommerce.workmap.burndown.service.BurndownService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * 번다운/번업·벨로시티 조회 API (T3-2 G, WMP-AGL-006, CR-012). 읽기 전용 — 적재는 이벤트/배치.
 */
@RestController
@RequiredArgsConstructor
public class BurndownController {

    private final BurndownService burndownService;

    /** 스프린트 번다운/번업(일자별 잔여/누적완료/기준선). */
    @GetMapping("/api/v1/sprints/{sprintId}/burndown")
    public ResponseDto<BurndownDtos.BurndownResponse> burndown(@PathVariable Long sprintId) {
        return ResponseDto.success(burndownService.burndown(sprintId));
    }

    /** 프로젝트 벨로시티(완료 스프린트별 완료포인트 + 평균). */
    @GetMapping("/api/v1/projects/{projectId}/velocity")
    public ResponseDto<BurndownDtos.VelocityResponse> velocity(@PathVariable Long projectId) {
        return ResponseDto.success(burndownService.velocity(projectId));
    }
}
