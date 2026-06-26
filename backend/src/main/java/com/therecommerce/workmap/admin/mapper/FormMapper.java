package com.therecommerce.workmap.admin.mapper;

import com.therecommerce.workmap.admin.domain.Form;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * forms 양식 빌더 매퍼 (WMP-ADM-005). fields는 JSONB 원본 String 패스스루.
 * 목록은 projectId 필터(옵션). 제출은 양식 정의를 읽어 WorkItemService.create로 위임(서비스).
 */
@Mapper
public interface FormMapper {

    List<Form> findAll(@Param("projectId") Long projectId,
                       @Param("limit") int limit,
                       @Param("offset") int offset);

    long countAll(@Param("projectId") Long projectId);

    Form findById(@Param("id") Long id);

    void insert(Form form);

    void update(Form form);

    void delete(@Param("id") Long id);
}
