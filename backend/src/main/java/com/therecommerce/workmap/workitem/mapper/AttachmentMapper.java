package com.therecommerce.workmap.workitem.mapper;

import com.therecommerce.workmap.workitem.domain.Attachment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AttachmentMapper {

    void insert(Attachment attachment);

    /** kind=null이면 전체(하위호환), 지정 시 REFERENCE/RESULT만(CR-051). */
    List<Attachment> findByWorkItem(@Param("workItemId") Long workItemId, @Param("kind") String kind);

    Attachment findById(@Param("id") Long id);

    void deleteById(@Param("id") Long id);
}
