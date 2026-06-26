package com.therecommerce.workmap.measure.mapper;

import com.therecommerce.workmap.measure.domain.MeasureUnit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MeasureUnitMapper {

    MeasureUnit findById(@Param("id") Long id);
}
