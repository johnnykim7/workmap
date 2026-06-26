package com.therecommerce.workmap.admin.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.workmap.admin.dto.AdminDtos;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.measure.domain.MeasureUnit;
import com.therecommerce.workmap.measure.mapper.MeasureUnitMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * 측정 단위 마스터 CRUD (WMP-ADM-001, POL-005).
 *
 * <p>가드: 시스템 기본 단위(is_system=true)는 수정·삭제 불가(WMP-7771). 사용 중(work_items 참조)인
 * 단위는 삭제 불가(WMP-7772). value_type은 NUMBER/BOOLEAN/SELECT 화이트리스트만 허용(BIZ-105).
 */
@Service
@RequiredArgsConstructor
public class AdminMeasureService {

    private static final Set<String> VALUE_TYPES = Set.of("NUMBER", "BOOLEAN", "SELECT");

    private final MeasureUnitMapper measureUnitMapper;

    @Transactional(readOnly = true)
    public PageResponse<AdminDtos.MeasureUnitResponse> list(PageRequest page) {
        List<AdminDtos.MeasureUnitResponse> items = measureUnitMapper
                .findAll(page.getPageSize(), page.getOffset())
                .stream().map(AdminDtos.MeasureUnitResponse::from).toList();
        long total = measureUnitMapper.countAll();
        return PageResponse.of(items, total, page);
    }

    @Transactional
    public AdminDtos.MeasureUnitResponse create(AdminDtos.MeasureUnitRequest req) {
        validateType(req.valueType());
        MeasureUnit unit = MeasureUnit.builder()
                .name(req.name())
                .valueType(req.valueType())
                .suffix(req.suffix())
                .options(req.options() == null ? List.of() : req.options())
                .isSystem(false)
                .sortOrder(req.sortOrder() == null ? 0 : req.sortOrder())
                .build();
        measureUnitMapper.insert(unit);
        return AdminDtos.MeasureUnitResponse.from(unit);
    }

    @Transactional
    public AdminDtos.MeasureUnitResponse update(Long id, AdminDtos.MeasureUnitRequest req) {
        MeasureUnit unit = mustFind(id);
        if (unit.isSystem()) {
            throw new BusinessException(WmpErrorCode.MEASURE_UNIT_SYSTEM_PROTECTED);
        }
        validateType(req.valueType());
        unit.setName(req.name());
        unit.setValueType(req.valueType());
        unit.setSuffix(req.suffix());
        unit.setOptions(req.options() == null ? List.of() : req.options());
        if (req.sortOrder() != null) {
            unit.setSortOrder(req.sortOrder());
        }
        measureUnitMapper.update(unit);
        return AdminDtos.MeasureUnitResponse.from(unit);
    }

    @Transactional
    public void delete(Long id) {
        MeasureUnit unit = mustFind(id);
        if (unit.isSystem()) {
            throw new BusinessException(WmpErrorCode.MEASURE_UNIT_SYSTEM_PROTECTED);
        }
        if (measureUnitMapper.isInUse(id)) {
            throw new BusinessException(WmpErrorCode.MEASURE_UNIT_IN_USE);
        }
        measureUnitMapper.delete(id);
    }

    private MeasureUnit mustFind(Long id) {
        MeasureUnit unit = measureUnitMapper.findById(id);
        if (unit == null) {
            throw new BusinessException(WmpErrorCode.MEASURE_UNIT_NOT_FOUND);
        }
        return unit;
    }

    private void validateType(String valueType) {
        if (valueType == null || !VALUE_TYPES.contains(valueType)) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST,
                    "value_type은 NUMBER/BOOLEAN/SELECT 중 하나여야 합니다.");
        }
    }
}
