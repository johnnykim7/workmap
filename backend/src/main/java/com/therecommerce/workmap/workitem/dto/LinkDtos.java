package com.therecommerce.workmap.workitem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 이슈 링크 DTO (T3-2 F1, WMP-WI-013, BIZ-109). 링크 유형: BLOCKS/BLOCKED_BY/RELATES_TO/DUPLICATES.
 * 생성 시 역방향(짝)은 서비스가 자동 저장하고, 조회는 source 기준 행 + 연결 항목 메타를 반환한다.
 */
public final class LinkDtos {

    private LinkDtos() {}

    public record CreateLinkRequest(
            @NotBlank String linkType,   // BLOCKS | BLOCKED_BY | RELATES_TO | DUPLICATES
            @NotNull Long targetId
    ) {}

    /** 연결 목록 한 행 — 링크 메타 + 연결된 항목(target) 요약. */
    public record LinkView(
            Long linkId,
            String linkType,
            Long targetId,
            String targetKey,
            String targetTitle,
            String targetIssueType,
            String targetCommonStatus
    ) {}
}
