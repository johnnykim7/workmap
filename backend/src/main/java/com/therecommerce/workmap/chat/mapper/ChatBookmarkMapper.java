package com.therecommerce.workmap.chat.mapper;

import com.therecommerce.workmap.chat.domain.ChatBookmark;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChatBookmarkMapper {

    void insert(ChatBookmark bookmark);

    ChatBookmark findByUserAndMessage(@Param("userId") Long userId,
                                      @Param("messageId") Long messageId);

    List<ChatBookmark> findByUser(@Param("userId") Long userId);

    int delete(@Param("userId") Long userId, @Param("messageId") Long messageId);
}
