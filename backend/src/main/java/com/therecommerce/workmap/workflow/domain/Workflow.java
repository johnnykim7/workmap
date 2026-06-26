package com.therecommerce.workmap.workflow.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * workflow 마스터 행 (T3-1, POL-001, WMP-ADM-003). 상태/전이 화이트리스트의 컨테이너.
 * is_system=true(시드 3종: 개발형/운영형/현장검증형)는 수정·삭제 불가.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Workflow {

    private Long id;
    private String name;
    private boolean isSystem;
}
