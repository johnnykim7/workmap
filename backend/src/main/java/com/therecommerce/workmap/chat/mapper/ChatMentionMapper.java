package com.therecommerce.workmap.chat.mapper;

import com.therecommerce.workmap.chat.domain.ChatMention;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChatMentionMapper {

    void insert(ChatMention mention);

    /** 내가 멘션된 목록(최신순). */
    List<ChatMention> findByMentionedUser(@Param("mentionedUserId") Long mentionedUserId);
}
