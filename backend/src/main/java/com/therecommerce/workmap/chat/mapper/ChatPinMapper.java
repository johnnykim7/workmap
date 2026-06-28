package com.therecommerce.workmap.chat.mapper;

import com.therecommerce.workmap.chat.domain.ChatPin;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChatPinMapper {

    void insert(ChatPin pin);

    ChatPin findByChannelAndMessage(@Param("channelId") Long channelId,
                                    @Param("messageId") Long messageId);

    List<ChatPin> findByChannel(@Param("channelId") Long channelId);

    int delete(@Param("channelId") Long channelId, @Param("messageId") Long messageId);
}
