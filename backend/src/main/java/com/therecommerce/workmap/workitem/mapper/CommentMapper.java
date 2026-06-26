package com.therecommerce.workmap.workitem.mapper;

import com.therecommerce.workmap.workitem.domain.Comment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CommentMapper {

    void insert(Comment comment);

    List<Comment> findByWorkItem(@Param("workItemId") Long workItemId);
}
