package com.therecommerce.workmap.chat.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ChatReadCursorMapper {

    /** 읽음 커서 upsert(channel_id, user_id UNIQUE). */
    int upsert(@Param("channelId") Long channelId,
               @Param("userId") Long userId,
               @Param("lastReadMessageId") Long lastReadMessageId);
}
