package com.therecommerce.workmap.workitem.mapper;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 통합 목록(GET /work-items, WMP-VIEW-001) 검색 조건. MyBatis 동적 쿼리 파라미터.
 * 가시성(BIZ-108)은 visibleProjectIds로 강제 — 서비스가 사용자가 볼 수 있는 프로젝트 id 목록을 채운다.
 */
@Getter
@Builder
public class WorkItemSearchCriteria {

    /** 특정 프로젝트로 한정(선택). null이면 visibleProjectIds 전체. */
    private Long projectId;

    /** 가시성 필터(BIZ-108) — 이 프로젝트들만 조회. 빈 목록이면 결과 없음. */
    private List<Long> visibleProjectIds;

    private String issueType;        // 유형 필터(선택)
    private String commonStatus;     // 공통상태 필터(선택)
    private String priority;         // 우선순위 필터(선택)
    private Long assigneeId;         // 담당자 필터(선택)
    private Long sprintId;           // 스프린트 필터(선택)
    private Long epicId;             // Epic 필터(선택)
    private String label;            // 라벨 필터(선택) — labels JSONB 배열에 포함되면 매칭
    private Boolean flagged;         // 막힘 깃발 필터(선택, CR-040) — true면 flagged=true만
    private String keyword;          // title/key LIKE(선택)

    /** 정렬 컬럼(화이트리스트 변환 후 주입). 기본 created_at. */
    private String sortColumn;
    /** ASC | DESC. */
    private String sortDirection;

    private int limit;
    private int offset;
}
