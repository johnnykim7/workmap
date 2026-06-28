package com.therecommerce.workmap.chat.mapper;

import com.therecommerce.workmap.chat.domain.ChatMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface ChatMessageMapper {

    void insert(ChatMessage message);

    ChatMessage findById(@Param("id") Long id);

    /**
     * 채널 메시지 목록(최신 100건을 created_at ASC 로 반환) + authorName(users 조인).
     * Map: id, channel_id, author_id, author_type, author_name, content_html,
     *      reply_count, last_reply_at, edited_at, created_at
     */
    List<Map<String, Object>> findByChannel(@Param("channelId") Long channelId,
                                            @Param("limit") int limit);

    int updateContent(@Param("id") Long id,
                      @Param("contentHtml") String contentHtml);

    int incrementReplyCount(@Param("id") Long id);

    int decrementReplyCount(@Param("id") Long id);

    int touchLastReplyAt(@Param("id") Long id);

    int deleteById(@Param("id") Long id);
}
