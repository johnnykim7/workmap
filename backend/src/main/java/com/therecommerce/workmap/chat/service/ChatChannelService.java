package com.therecommerce.workmap.chat.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.chat.domain.ChatChannel;
import com.therecommerce.workmap.chat.domain.ChatChannelMember;
import com.therecommerce.workmap.chat.dto.ChatDtos.*;
import com.therecommerce.workmap.chat.mapper.ChatChannelMapper;
import com.therecommerce.workmap.chat.mapper.ChatChannelMemberMapper;
import com.therecommerce.workmap.chat.mapper.ChatReadCursorMapper;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * 채널 + 멤버 + 읽음커서 서비스 (CR-025).
 * 워크스페이스 단위 채널 목록은 각 채널의 unreadCount(읽음커서 기반)를 함께 채운다.
 */
@Service
@RequiredArgsConstructor
public class ChatChannelService {

    private final ChatChannelMapper channelMapper;
    private final ChatChannelMemberMapper memberMapper;
    private final ChatReadCursorMapper readCursorMapper;

    // ── 채널 ────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ChannelResponse> list(Long workspaceId, Long userId) {
        return channelMapper.findByWorkspace(workspaceId).stream()
                .map(c -> toResponse(c, channelMapper.countUnread(c.getId(), userId)))
                .toList();
    }

    @Transactional(readOnly = true)
    public ChannelResponse get(Long channelId, Long userId) {
        ChatChannel c = requireChannel(channelId);
        return toResponse(c, channelMapper.countUnread(channelId, userId));
    }

    @Transactional
    public ChannelResponse create(ChannelCreateRequest req, Long userId) {
        if (req.name() == null || req.name().isBlank()) {
            throw new BusinessException(WmpErrorCode.CHAT_CHANNEL_NAME_REQUIRED);
        }
        if (channelMapper.findByWorkspaceAndName(req.workspaceId(), req.name()) != null) {
            throw new BusinessException(WmpErrorCode.CHAT_CHANNEL_NAME_DUPLICATE);
        }
        ChatChannel channel = ChatChannel.builder()
                .workspaceId(req.workspaceId())
                .name(req.name())
                .displayName(req.displayName())
                .description(req.description())
                .isSystem(false)
                .memberCount(1)
                .createdBy(userId)
                .build();
        channelMapper.insert(channel);
        // 생성자를 OWNER 멤버로 자동 추가
        memberMapper.insertIgnore(ChatChannelMember.builder()
                .channelId(channel.getId())
                .userId(userId)
                .role("OWNER")
                .build());
        return toResponse(channel, 0L);
    }

    @Transactional
    public ChannelResponse update(Long channelId, ChannelUpdateRequest req) {
        ChatChannel c = requireChannel(channelId);
        channelMapper.updateInfo(channelId, req.displayName(), req.description());
        c.setDisplayName(req.displayName());
        c.setDescription(req.description());
        return toResponse(c, 0L);
    }

    @Transactional
    public void delete(Long channelId) {
        ChatChannel c = requireChannel(channelId);
        if (c.isSystem()) {
            throw new BusinessException(WmpErrorCode.CHAT_CHANNEL_SYSTEM_PROTECTED);
        }
        memberMapper.deleteByChannel(channelId);
        channelMapper.deleteById(channelId);
    }

    // ── 읽음 커서 ───────────────────────────────────────────────────────
    @Transactional
    public void updateReadCursor(Long channelId, Long userId, Long lastReadMessageId) {
        requireChannel(channelId);
        readCursorMapper.upsert(channelId, userId, lastReadMessageId);
    }

    // ── 멤버 ────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers(Long channelId) {
        requireChannel(channelId);
        return memberMapper.findByChannel(channelId).stream()
                .map(this::toMemberResponse)
                .toList();
    }

    @Transactional
    public void addMember(Long channelId, Long userId) {
        requireChannel(channelId);
        memberMapper.insertIgnore(ChatChannelMember.builder()
                .channelId(channelId)
                .userId(userId)
                .role("MEMBER")
                .build());
        channelMapper.setMemberCount(channelId, (int) memberMapper.countByChannel(channelId));
    }

    @Transactional
    public void removeMember(Long channelId, Long userId) {
        requireChannel(channelId);
        memberMapper.delete(channelId, userId);
        channelMapper.setMemberCount(channelId, (int) memberMapper.countByChannel(channelId));
    }

    // ── 내부 ────────────────────────────────────────────────────────────
    private ChatChannel requireChannel(Long channelId) {
        ChatChannel c = channelMapper.findById(channelId);
        if (c == null) {
            throw new BusinessException(WmpErrorCode.CHAT_CHANNEL_NOT_FOUND);
        }
        return c;
    }

    private ChannelResponse toResponse(ChatChannel c, long unreadCount) {
        return new ChannelResponse(
                c.getId(), c.getWorkspaceId(), c.getName(), c.getDisplayName(),
                c.getDescription(), c.isSystem(), c.getMemberCount(),
                c.getLastMessageAt(), c.getCreatedAt(), unreadCount);
    }

    private MemberResponse toMemberResponse(Map<String, Object> row) {
        return new MemberResponse(
                ChatRowUtil.asLong(row.get("user_id")),
                (String) row.get("user_name"),
                (String) row.get("role"),
                ChatRowUtil.asOffsetDateTime(row.get("joined_at")));
    }
}
