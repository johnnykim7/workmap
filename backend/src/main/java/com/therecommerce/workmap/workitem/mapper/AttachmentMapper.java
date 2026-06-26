package com.therecommerce.workmap.workitem.mapper;

import com.therecommerce.workmap.workitem.domain.Attachment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AttachmentMapper {

    void insert(Attachment attachment);

    List<Attachment> findByWorkItem(@Param("workItemId") Long workItemId);
}
