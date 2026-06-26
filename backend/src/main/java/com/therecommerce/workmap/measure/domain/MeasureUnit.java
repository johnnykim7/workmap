package com.therecommerce.workmap.measure.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * measure_unit 마스터(T3-1, POL-005). value_type(NUMBER/BOOLEAN/SELECT)이 progress 계산 방식을 결정(BIZ-105).
 * Sprint 5 관리자 CRUD는 별도 — 여기서는 progress 계산을 위한 조회만 둔다.
 */
@Getter
@Setter
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
