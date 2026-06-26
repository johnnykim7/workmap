package com.therecommerce.workmap.admin.mapper;

import com.therecommerce.workmap.admin.domain.FieldScheme;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * field_scheme 마스터 매퍼 (WMP-ADM-002, POL-006).
 */
@Mapper
public interface FieldSchemeMapper {

    /** 필터(projectId / issueTypeCode 선택) + 페이징. */
    List<FieldScheme> find(@Param("projectId") Long projectId,
                           @Param("issueTypeCode") String issueTypeCode,
                           @Param("limit") int limit,
                           @Param("offset") int offset);

    long count(@Param("projectId") Long projectId,
               @Param("issueTypeCode") String issueTypeCode);

    FieldScheme findById(@Param("id") Long id);

    void insert(FieldScheme scheme);

    void update(FieldScheme scheme);

    void delete(@Param("id") Long id);
}
