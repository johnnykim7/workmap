package com.therecommerce.workmap.admin.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * field_scheme 마스터 행 (T3-1, POL-006, WMP-ADM-002). 단일 work_items 테이블 위에서
 * 유형(issue_type_code)·프로젝트(project_id)별로 필드 표시 on/off·필수 여부를 차등한다(BIZ-102).
 * project_id=null 은 전역 기본 스킴. MyBatis setter 매핑을 위해 no-arg 생성자 보유(CR-008).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldScheme {

    private Long id;
    private Long projectId;        // null = 전역 기본
    private String issueTypeCode;
    private String fieldKey;
    private boolean isVisible;
    private boolean isRequired;
    private int sortOrder;
}
