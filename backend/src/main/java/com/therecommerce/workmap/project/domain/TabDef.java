package com.therecommerce.workmap.project.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * tab_def — 전역 기본 탭 정의(코드 상수 PROJECT_TAB_LABEL DB화, CR-020).
 * code=route-paths ProjectTab 키. label=전역 기본 한글 라벨.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TabDef {
    private String code;
    private String label;
    private String icon;
    private int sortOrder;
}
