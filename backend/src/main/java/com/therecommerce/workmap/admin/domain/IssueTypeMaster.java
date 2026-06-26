package com.therecommerce.workmap.admin.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * issue_type 마스터 도메인 (T3-1, WMP-ADM-004). 업무 유형의 단일 진실 소스(하드코딩 금지, BIZ-107).
 * 시스템 기본 5종(EPIC/STORY/TASK/BUG/SUBTASK, is_system=true)은 삭제 불가.
 *
 * <p>참고: {@code workitem.domain.IssueType} enum은 계층 정합성(BIZ-103) 판정용 코드이고,
 * 이 도메인은 마스터 테이블 행(라벨/색/아이콘/정렬) 관리용이다(관심사 분리).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueTypeMaster {

    private Long id;
    private String code;
    private String label;
    private int depth;
    private String color;
    private String icon;
    private boolean isSystem;
    private int sortOrder;
}
