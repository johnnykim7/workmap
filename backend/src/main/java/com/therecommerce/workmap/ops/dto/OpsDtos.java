package com.therecommerce.workmap.ops.dto;

import com.therecommerce.workmap.workitem.dto.WorkItemDtos;

import java.time.LocalDate;
import java.util.List;

/** 운영 실행 API DTO(T3-2 H). 처리량(OPS-002) / 현장이슈→백로그 전환(OPS-003). */
public final class OpsDtos {

    private OpsDtos() {}

    /** 처리량 조회 응답(WMP-OPS-002): 기간 내 담당자별 완료 건수 집계. */
    public record ThroughputResponse(
            Long projectId,
            LocalDate from,
            LocalDate to,
            int totalDone,
            List<AssigneeThroughput> byAssignee
    ) {}

    /** 담당자 1명의 처리량(미배정은 assigneeId=null). */
    public record AssigneeThroughput(
            Long assigneeId,
            int doneCount
    ) {}

    /**
     * 현장 이슈 → 개발 백로그 전환 요청(WMP-OPS-003).
     * 전환 대상 프로젝트(개발 프로젝트)와 신규 항목 유형/제목 지정. 원본과 RELATES_TO 링크로 연결.
     */
    public record PromoteRequest(
            Long targetProjectId,   // 개발 프로젝트 id
            String issueType,       // 신규 항목 유형(기본 STORY)
            String title,           // 미지정 시 원본 title 사용
            String description
    ) {}

    /** 전환 결과: 신규 백로그 항목 + 원본 id. */
    public record PromoteResult(
            Long originId,
            WorkItemDtos.Response promoted
    ) {}
}
