package com.therecommerce.workmap.view.mapper;

import com.therecommerce.workmap.view.domain.SavedFilter;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 저장 필터 매퍼(WMP-VIEW-004, CR-012). 목록은 내 것 + 공유된 것.
 */
@Mapper
public interface SavedFilterMapper {

    void insert(SavedFilter filter);

    SavedFilter findById(@Param("id") Long id);

    /** 내 것(owner_id) + 공유된 것(is_shared=true). 이름순. */
    List<SavedFilter> findVisible(@Param("viewerId") Long viewerId);

    void update(SavedFilter filter);

    void delete(@Param("id") Long id);
}
