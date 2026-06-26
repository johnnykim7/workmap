package com.therecommerce.workmap.view.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * 저장 필터(WMP-VIEW-004, CR-012). 목록 필터 조건(query, JSONB)을 사용자가 저장/공유.
 *
 * <p>query는 JSONB 원본을 String으로 패스스루(forms.fields와 동일 방식 — JDBC stringtype=unspecified).
 * is_shared=true면 전 사용자 목록에 노출. 수정·삭제는 소유자만(owner_id 검증, 서비스에서).
 * MyBatis setter 매핑 위해 @NoArgsConstructor + setter(CR-008 규칙).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedFilter {

    private Long id;
    private Long ownerId;
    private String name;
    private String query;        // JSONB 원본 패스스루
    private boolean shared;       // is_shared
    private OffsetDateTime createdAt;
}
