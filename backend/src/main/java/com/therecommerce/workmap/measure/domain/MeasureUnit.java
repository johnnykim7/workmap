package com.therecommerce.workmap.measure.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * measure_unit 마스터(T3-1, POL-005). value_type(NUMBER/BOOLEAN/SELECT)이 progress 계산 방식을 결정(BIZ-105).
 * 관리자 CRUD(WMP-ADM-001) 대상. MyBatis setter 매핑을 위해 no-arg 생성자 보유(CR-008).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeasureUnit {

    private Long id;
    private String name;
    private String valueType;   // MeasureValueType: NUMBER / BOOLEAN / SELECT
    private String suffix;
    private List<String> options;
    private boolean isSystem;
    private int sortOrder;
}
