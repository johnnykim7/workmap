package com.therecommerce.workmap.chat.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.chat.domain.*;
import com.therecommerce.workmap.chat.dto.ChatDtos.*;
import com.therecommerce.workmap.chat.mapper.*;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 핀 / 북마크 / 알림설정 / 멘션 조회 서비스 (CR-025).
 * 핀·북마크는 토글, 알림설정은 upsert.
 */
@Service
@RequiredArgsConstructor
public class ChatEnhancedService {

    private final ChatPinMapper pinMapper;
    private final ChatBookmarkMapper bookmarkMapper;
    private final ChatNotificationSettingMapper notificationSettingMapper;
    private final ChatMentionMapper mentionMapper;
    private final ChatMessageMapper messageMapper;
    private final ChatChannelMapper channelMapper;

    // ── 핀 ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PinResponse> listPins(Long channelId) {
        requireChannel(channelId);
        return pinMapper.findByChannel(channelId).stream().map(this::toPin).toList();
    }

    /** 핀 토글(채널당 메시지 1회 UNIQUE). 핀 상태(true=핀됨) 반환. */
    @Transactional
    public boolean togglePin(Long channelId, Long messageId, Long userId) {
        requireChannel(channelId);
        requireMessage(messageId);
        ChatPin existing = pinMapper.findByChannelAndMessage(channelId, messageId);
        if (existing != null) {
            pinMapper.delete(channelId, messageId);
            return false;
        }
        pinMapper.insert(ChatPin.builder()
                .channelId(channelId).messageId(messageId).pinnedBy(userId).build());
        return true;
    }

    @Transactional
    public void removePin(Long channelId, Long messageId) {
        requireChannel(channelId);
        pinMapper.delete(channelId, messageId);
    }

    // ── 북마크 ──────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<BookmarkResponse> listBookmarks(Long userId) {
        return bookmarkMapper.findByUser(userId).stream().map(this::toBookmark).toList();
    }

    /** 북마크 토글(사용자별 메시지 1회 UNIQUE). 북마크 상태(true=추가됨) 반환. */
    @Transactional
    public boolean toggleBookmark(Long userId, Long messageId) {
        requireMessage(messageId);
        ChatBookmark existing = bookmarkMapper.findByUserAndMessage(userId, messageId);
        if (existing != null) {
            bookmarkMapper.delete(userId, messageId);
            return false;
        }
        bookmarkMapper.insert(ChatBookmark.builder().userId(userId).messageId(messageId).build());
        return true;
    }

    @Transactional
    public void removeBookmark(Long userId, Long messageId) {
        bookmarkMapper.delete(userId, messageId);
    }

    // ── 알림 설정 ───────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public NotificationSettingResponse getNotificationSetting(Long channelId, Long userId) {
        requireChannel(channelId);
        ChatNotificationSetting s = notificationSettingMapper.findByUserAndChannel(userId, channelId);
        if (s == null) {
            // 미설정이면 기본값(ALL) 표현
            return new NotificationSettingResponse(null, userId, channelId, null, "ALL", null);
        }
        return toSetting(s);
    }

    @Transactional
    public NotificationSettingResponse upsertNotificationSetting(
            Long channelId, Long userId, NotificationSettingRequest req) {
        requireChannel(channelId);
        String level = (req.notifyLevel() == null || req.notifyLevel().isBlank())
                ? "ALL" : req.notifyLevel();
        notificationSettingMapper.upsert(userId, channelId, level, req.muteUntil());
        return toSetting(notificationSettingMapper.findByUserAndChannel(userId, channelId));
    }

    // ── 멘션 ────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MentionResponse> listMyMentions(Long userId) {
        return mentionMapper.findByMentionedUser(userId).stream().map(this::toMention).toList();
    }

    // ── 내부 ────────────────────────────────────────────────────────────
    private void requireChannel(Long channelId) {
        if (channelMapper.findById(channelId) == null) {
            throw new BusinessException(WmpErrorCode.CHAT_CHANNEL_NOT_FOUND);
        }
    }

    private void requireMessage(Long messageId) {
        if (messageMapper.findById(messageId) == null) {
            throw new BusinessException(WmpErrorCode.CHAT_MESSAGE_NOT_FOUND);
        }
    }

    private PinResponse toPin(ChatPin p) {
        return new PinResponse(p.getId(), p.getChannelId(), p.getMessageId(),
                p.getPinnedBy(), p.getCreatedAt());
    }

    private BookmarkResponse toBookmark(ChatBookmark b) {
        return new BookmarkResponse(b.getId(), b.getUserId(), b.getMessageId(), b.getCreatedAt());
    }

    private NotificationSettingResponse toSetting(ChatNotificationSetting s) {
        return new NotificationSettingResponse(s.getId(), s.getUserId(), s.getChannelId(),
                s.getMuteUntil(), s.getNotifyLevel(), s.getUpdatedAt());
    }

    private MentionResponse toMention(ChatMention m) {
        return new MentionResponse(m.getId(), m.getMessageId(), m.getReplyId(),
                m.getMentionedUserId(), m.getCreatedAt());
    }
}
