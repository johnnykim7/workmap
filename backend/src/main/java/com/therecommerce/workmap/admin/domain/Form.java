package com.therecommerce.workmap.admin.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * forms 양식 빌더 도메인 (T3-1, WMP-ADM-005, Phase 2). 제출 시 생성할 유형(issue_type_code)과
 * 필드 배치(fields, JSONB)를 정의한다. is_public=true면 외부 게스트 공유 가능.
 *
 * <p>fields는 JSONB 원본을 String으로 패스스루(checklist 컬럼과 동일 방식 — JDBC stringtype=unspecified).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Form {

    private Long id;
    private Long projectId;
    private String issueTypeCode;
    private String name;
    private String fields;        // JSONB 원본 패스스루
    private boolean isPublic;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
