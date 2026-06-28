package com.therecommerce.workmap.chat.mapper;

import com.therecommerce.workmap.chat.domain.ChatChannel;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChatChannelMapper {

    void insert(ChatChannel channel);

    ChatChannel findById(@Param("id") Long id);

    /** 워크스페이스 채널 목록 — 시스템 채널 먼저, 그다음 이름순. */
    List<ChatChannel> findByWorkspace(@Param("workspaceId") Long workspaceId);

    ChatChannel findByWorkspaceAndName(@Param("workspaceId") Long workspaceId,
                                       @Param("name") String name);

    int updateInfo(@Param("id") Long id,
                   @Param("displayName") String displayName,
                   @Param("description") String description);

    int touchLastMessageAt(@Param("id") Long id);

    int updateMemberCount(@Param("id") Long id, @Param("delta") int delta);

    int setMemberCount(@Param("id") Long id, @Param("count") int count);

    int deleteById(@Param("id") Long id);

    /** unreadCount = 채널에서 내 last_read_message_id 보다 큰 id 메시지 수(커서 없으면 전체). */
    long countUnread(@Param("channelId") Long channelId, @Param("userId") Long userId);
}
