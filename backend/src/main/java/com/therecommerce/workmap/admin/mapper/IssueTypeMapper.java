package com.therecommerce.workmap.admin.mapper;

import com.therecommerce.workmap.admin.domain.IssueTypeMaster;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * issue_type 마스터 매퍼 (WMP-ADM-004). 코드 UNIQUE, 시스템 5종 보호는 서비스에서 가드.
 * 사용 중(work_items.issue_type 참조) 삭제 가드는 isInUse로 판정.
 */
@Mapper
public interface IssueTypeMapper {

    List<IssueTypeMaster> findAll(@Param("limit") int limit, @Param("offset") int offset);

    long countAll();

    IssueTypeMaster findById(@Param("id") Long id);

    boolean existsByCode(@Param("code") String code);

    void insert(IssueTypeMaster type);

    void update(IssueTypeMaster type);

    void delete(@Param("id") Long id);

    /** 사용 중 여부(work_items.issue_type = code 참조). 삭제 가드. */
    boolean isInUse(@Param("code") String code);
}
