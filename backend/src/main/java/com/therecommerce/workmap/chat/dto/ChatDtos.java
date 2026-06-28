package com.therecommerce.workmap.chat.dto;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 커뮤니케이션(Chat) 모듈 DTO (CR-025, axopm comm 포팅).
 * 응답은 record. authorName/userName 은 users.name 조인으로 채운다(비정규화 저장 안 함).
 */
public final class ChatDtos {

    private ChatDtos() {}

    // ── 채널 ────────────────────────────────────────────────────────────
    public record ChannelResponse(
            Long id,
            Long workspaceId,
            String name,
            String displayName,
            String description,
            boolean isSystem,
            int memberCount,
            OffsetDateTime lastMessageAt,
            OffsetDateTime createdAt,
            long unreadCount
    ) {}

    public record ChannelCreateRequest(
            Long workspaceId,
            String name,
            String displayName,
            String description
    ) {}

    public record ChannelUpdateRequest(
            String displayName,
            String description
    ) {}

    // ── 메시지 ──────────────────────────────────────────────────────────
    public record MessageResponse(
            Long id,
            Long channelId,
            Long authorId,
            String authorType,
            String authorName,
            String contentHtml,
            int replyCount,
            OffsetDateTime lastReplyAt,
            OffsetDateTime editedAt,
            OffsetDateTime createdAt,
            List<ReactionSummary> reactions
    ) {}

    public record MessageCreateRequest(
            Long workspaceId,
            String contentHtml,
            List<Long> mentionedUserIds
    ) {}

    public record MessageUpdateRequest(
            String contentHtml
    ) {}

    // ── 답글 ────────────────────────────────────────────────────────────
    public record ReplyResponse(
            Long id,
            Long messageId,
            Long channelId,
            Long authorId,
            String authorName,
            String contentHtml,
            OffsetDateTime editedAt,
            OffsetDateTime createdAt,
            List<ReactionSummary> reactions
    ) {}

    public record ReplyCreateRequest(
            Long workspaceId,
            String contentHtml,
            List<Long> mentionedUserIds
    ) {}

    public record ReplyUpdateRequest(
            String contentHtml
    ) {}

    // ── 리액션 ──────────────────────────────────────────────────────────
    public record ReactionSummary(
            String emoji,
            int count,
            List<Long> userIds
    ) {}

    public record ReactionRequest(
            String emoji
    ) {}

    // ── 읽음 커서 ───────────────────────────────────────────────────────
    public record ReadCursorRequest(
            Long lastReadMessageId
    ) {}

    // ── 멤버 ────────────────────────────────────────────────────────────
    public record MemberResponse(
            Long userId,
            String userName,
            String role,
            OffsetDateTime joinedAt
    ) {}

    public record MemberAddRequest(
            Long userId
    ) {}

    // ── 핀 ──────────────────────────────────────────────────────────────
    public record PinResponse(
            Long id,
            Long channelId,
            Long messageId,
            Long pinnedBy,
            OffsetDateTime createdAt
    ) {}

    // ── 북마크 ──────────────────────────────────────────────────────────
    public record BookmarkResponse(
            Long id,
            Long userId,
            Long messageId,
            OffsetDateTime createdAt
    ) {}

    // ── 알림 설정 ───────────────────────────────────────────────────────
    public record NotificationSettingResponse(
            Long id,
            Long userId,
            Long channelId,
            OffsetDateTime muteUntil,
            String notifyLevel,
            OffsetDateTime updatedAt
    ) {}

    public record NotificationSettingRequest(
            String notifyLevel,
            OffsetDateTime muteUntil
    ) {}

    // ── 멘션 ────────────────────────────────────────────────────────────
    public record MentionResponse(
            Long id,
            Long messageId,
            Long replyId,
            Long mentionedUserId,
            OffsetDateTime createdAt
    ) {}
}
