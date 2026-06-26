package com.therecommerce.workmap.ops.mapper;

import com.therecommerce.workmap.ops.domain.FieldVerification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 현장검증 기록 매퍼(WMP-OPS-004, CR-012).
 */
@Mapper
public interface FieldVerificationMapper {

    void insert(FieldVerification verification);

    FieldVerification findById(@Param("id") Long id);

    /** 업무 항목별 현장검증 기록(검증일/생성순 DESC — 최신 먼저). */
    List<FieldVerification> findByWorkItem(@Param("workItemId") Long workItemId);
}
