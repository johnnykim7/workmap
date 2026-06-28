package com.therecommerce.workmap.chat.mapper;

import com.therecommerce.workmap.chat.domain.ChatChannelMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface ChatChannelMemberMapper {

    /** 멤버 추가(중복 무시 — ON CONFLICT DO NOTHING). */
    int insertIgnore(ChatChannelMember member);

    /** 멤버 목록 + userName(users 조인). Map: user_id, user_name, role, joined_at */
    List<Map<String, Object>> findByChannel(@Param("channelId") Long channelId);

    ChatChannelMember findByChannelAndUser(@Param("channelId") Long channelId,
                                           @Param("userId") Long userId);

    long countByChannel(@Param("channelId") Long channelId);

    int delete(@Param("channelId") Long channelId, @Param("userId") Long userId);

    int deleteByChannel(@Param("channelId") Long channelId);
}
