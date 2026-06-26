package com.therecommerce.workmap.measure.mapper;

import com.therecommerce.workmap.measure.domain.MeasureUnit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MeasureUnitMapper {

    MeasureUnit findById(@Param("id") Long id);

    // ── 관리자 CRUD (WMP-ADM-001) ──
    List<MeasureUnit> findAll(@Param("limit") int limit, @Param("offset") int offset);

    long countAll();

    void insert(MeasureUnit unit);

    void update(MeasureUnit unit);

    void delete(@Param("id") Long id);

    /** 사용 중 여부(work_items.measure_unit_id 참조). 삭제 가드. */
    boolean isInUse(@Param("id") Long id);
}
