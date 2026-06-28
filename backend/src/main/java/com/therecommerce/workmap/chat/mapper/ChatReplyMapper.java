package com.therecommerce.workmap.chat.mapper;

import com.therecommerce.workmap.chat.domain.ChatReply;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface ChatReplyMapper {

    void insert(ChatReply reply);

    ChatReply findById(@Param("id") Long id);

    /** 메시지 답글 목록(created_at ASC) + authorName(users 조인). */
    List<Map<String, Object>> findByMessage(@Param("messageId") Long messageId);

    int updateContent(@Param("id") Long id,
                      @Param("contentHtml") String contentHtml);

    int deleteById(@Param("id") Long id);

    int deleteByMessageId(@Param("messageId") Long messageId);
}
