package com.therecommerce.workmap.chat.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.chat.domain.ChatMention;
import com.therecommerce.workmap.chat.domain.ChatMessage;
import com.therecommerce.workmap.chat.domain.ChatReaction;
import com.therecommerce.workmap.chat.domain.ChatReply;
import com.therecommerce.workmap.chat.dto.ChatDtos.*;
import com.therecommerce.workmap.chat.mapper.*;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * 메시지 + 답글 + 멘션 저장 서비스 (CR-025).
 * 목록 조회 시 리액션을 배치(findByMessageIds/findByReplyIds)로 가져와 N+1을 피한다.
 * 멘션은 chat_mentions 저장만(알림 연동은 후속).
 */
@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private static final int MESSAGE_LIMIT = 100;

    private final ChatMessageMapper messageMapper;
    private final ChatReplyMapper replyMapper;
    private final ChatReactionMapper reactionMapper;
    private final ChatChannelMapper channelMapper;
    private final ChatMentionMapper mentionMapper;

    // ── 메시지 ──────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MessageResponse> listMessages(Long channelId) {
        requireChannel(channelId);
        List<Map<String, Object>> rows = messageMapper.findByChannel(channelId, MESSAGE_LIMIT);
        List<Long> ids = rows.stream().map(r -> ChatRowUtil.asLong(r.get("id"))).toList();
        Map<Long, List<ReactionSummary>> reactionsByMsg = ids.isEmpty()
                ? Map.of()
                : ChatReactionSummaryHelper.summarizeBatch(
                        reactionMapper.findByMessageIds(ids), ChatReaction::getMessageId);
        return rows.stream()
                .map(r -> toMessageResponse(r,
                        reactionsByMsg.getOrDefault(ChatRowUtil.asLong(r.get("id")), List.of())))
                .toList();
    }

    @Transactional
    public MessageResponse createMessage(Long channelId, MessageCreateRequest req, Long userId) {
        requireChannel(channelId);
        if (req.contentHtml() == null || req.contentHtml().isBlank()) {
            throw new BusinessException(WmpErrorCode.CHAT_CONTENT_REQUIRED);
        }
        ChatMessage msg = ChatMessage.builder()
                .channelId(channelId)
                .workspaceId(req.workspaceId())
                .authorId(userId)
                .authorType("USER")
                .contentHtml(req.contentHtml())
                .build();
        messageMapper.insert(msg);
        channelMapper.touchLastMessageAt(channelId);
        saveMentions(msg.getId(), null, req.mentionedUserIds());
        ChatMessage saved = messageMapper.findById(msg.getId());
        return toMessageResponseFromDomain(saved, List.of());
    }

    @Transactional
    public MessageResponse updateMessage(Long messageId, MessageUpdateRequest req, Long userId) {
        ChatMessage msg = requireMessage(messageId);
        requireAuthor(msg.getAuthorId(), userId, WmpErrorCode.CHAT_MESSAGE_FORBIDDEN);
        if (req.contentHtml() == null || req.contentHtml().isBlank()) {
            throw new BusinessException(WmpErrorCode.CHAT_CONTENT_REQUIRED);
        }
        messageMapper.updateContent(messageId, req.contentHtml());
        ChatMessage saved = messageMapper.findById(messageId);
        List<ReactionSummary> reactions = ChatReactionSummaryHelper.summarize(
                reactionMapper.findByMessageId(messageId));
        return toMessageResponseFromDomain(saved, reactions);
    }

    @Transactional
    public void deleteMessage(Long messageId, Long userId) {
        ChatMessage msg = requireMessage(messageId);
        requireAuthor(msg.getAuthorId(), userId, WmpErrorCode.CHAT_MESSAGE_FORBIDDEN);
        replyMapper.deleteByMessageId(messageId);   // 하위 답글도 삭제
        messageMapper.deleteById(messageId);
    }

    // ── 답글 ────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ReplyResponse> listReplies(Long messageId) {
        requireMessage(messageId);
        List<Map<String, Object>> rows = replyMapper.findByMessage(messageId);
        List<Long> ids = rows.stream().map(r -> ChatRowUtil.asLong(r.get("id"))).toList();
        Map<Long, List<ReactionSummary>> reactionsByReply = ids.isEmpty()
                ? Map.of()
                : ChatReactionSummaryHelper.summarizeBatch(
                        reactionMapper.findByReplyIds(ids), ChatReaction::getReplyId);
        return rows.stream()
                .map(r -> toReplyResponse(r,
                        reactionsByReply.getOrDefault(ChatRowUtil.asLong(r.get("id")), List.of())))
                .toList();
    }

    @Transactional
    public ReplyResponse createReply(Long messageId, ReplyCreateRequest req, Long userId) {
        ChatMessage msg = requireMessage(messageId);
        if (req.contentHtml() == null || req.contentHtml().isBlank()) {
            throw new BusinessException(WmpErrorCode.CHAT_CONTENT_REQUIRED);
        }
        ChatReply reply = ChatReply.builder()
                .messageId(messageId)
                .channelId(msg.getChannelId())
                .workspaceId(req.workspaceId())
                .authorId(userId)
                .contentHtml(req.contentHtml())
                .build();
        replyMapper.insert(reply);
        messageMapper.incrementReplyCount(messageId);   // reply_count++ & last_reply_at
        saveMentions(null, reply.getId(), req.mentionedUserIds());
        ChatReply saved = replyMapper.findById(reply.getId());
        return toReplyResponseFromDomain(saved, List.of());
    }

    @Transactional
    public ReplyResponse updateReply(Long replyId, ReplyUpdateRequest req, Long userId) {
        ChatReply reply = requireReply(replyId);
        requireAuthor(reply.getAuthorId(), userId, WmpErrorCode.CHAT_REPLY_FORBIDDEN);
        if (req.contentHtml() == null || req.contentHtml().isBlank()) {
            throw new BusinessException(WmpErrorCode.CHAT_CONTENT_REQUIRED);
        }
        replyMapper.updateContent(replyId, req.contentHtml());
        ChatReply saved = replyMapper.findById(replyId);
        List<ReactionSummary> reactions = ChatReactionSummaryHelper.summarize(
                reactionMapper.findByReplyId(replyId));
        return toReplyResponseFromDomain(saved, reactions);
    }

    @Transactional
    public void deleteReply(Long replyId, Long userId) {
        ChatReply reply = requireReply(replyId);
        requireAuthor(reply.getAuthorId(), userId, WmpErrorCode.CHAT_REPLY_FORBIDDEN);
        replyMapper.deleteById(replyId);
        messageMapper.decrementReplyCount(reply.getMessageId());
    }

    // ── 내부 ────────────────────────────────────────────────────────────
    private void saveMentions(Long messageId, Long replyId, List<Long> mentionedUserIds) {
        if (mentionedUserIds == null) return;
        for (Long uid : mentionedUserIds) {
            if (uid == null) continue;
            mentionMapper.insert(ChatMention.builder()
                    .messageId(messageId)
                    .replyId(replyId)
                    .mentionedUserId(uid)
                    .build());
        }
    }

    private void requireChannel(Long channelId) {
        if (channelMapper.findById(channelId) == null) {
            throw new BusinessException(WmpErrorCode.CHAT_CHANNEL_NOT_FOUND);
        }
    }

    private ChatMessage requireMessage(Long messageId) {
        ChatMessage m = messageMapper.findById(messageId);
        if (m == null) {
            throw new BusinessException(WmpErrorCode.CHAT_MESSAGE_NOT_FOUND);
        }
        return m;
    }

    private ChatReply requireReply(Long replyId) {
        ChatReply r = replyMapper.findById(replyId);
        if (r == null) {
            throw new BusinessException(WmpErrorCode.CHAT_REPLY_NOT_FOUND);
        }
        return r;
    }

    private void requireAuthor(Long authorId, Long userId, WmpErrorCode forbidden) {
        if (authorId == null || !authorId.equals(userId)) {
            throw new BusinessException(forbidden);
        }
    }

    private MessageResponse toMessageResponse(Map<String, Object> r, List<ReactionSummary> reactions) {
        return new MessageResponse(
                ChatRowUtil.asLong(r.get("id")),
                ChatRowUtil.asLong(r.get("channel_id")),
                ChatRowUtil.asLong(r.get("author_id")),
                ChatRowUtil.asString(r.get("author_type")),
                ChatRowUtil.asString(r.get("author_name")),
                ChatRowUtil.asString(r.get("content_html")),
                ChatRowUtil.asInt(r.get("reply_count")),
                (OffsetDateTime) r.get("last_reply_at"),
                (OffsetDateTime) r.get("edited_at"),
                (OffsetDateTime) r.get("created_at"),
                reactions);
    }

    private MessageResponse toMessageResponseFromDomain(ChatMessage m, List<ReactionSummary> reactions) {
        return new MessageResponse(
                m.getId(), m.getChannelId(), m.getAuthorId(), m.getAuthorType(),
                null, m.getContentHtml(), m.getReplyCount(),
                m.getLastReplyAt(), m.getEditedAt(), m.getCreatedAt(), reactions);
    }

    private ReplyResponse toReplyResponse(Map<String, Object> r, List<ReactionSummary> reactions) {
        return new ReplyResponse(
                ChatRowUtil.asLong(r.get("id")),
                ChatRowUtil.asLong(r.get("message_id")),
                ChatRowUtil.asLong(r.get("channel_id")),
                ChatRowUtil.asLong(r.get("author_id")),
                ChatRowUtil.asString(r.get("author_name")),
                ChatRowUtil.asString(r.get("content_html")),
                (OffsetDateTime) r.get("edited_at"),
                (OffsetDateTime) r.get("created_at"),
                reactions);
    }

    private ReplyResponse toReplyResponseFromDomain(ChatReply r, List<ReactionSummary> reactions) {
        return new ReplyResponse(
                r.getId(), r.getMessageId(), r.getChannelId(), r.getAuthorId(),
                null, r.getContentHtml(), r.getEditedAt(), r.getCreatedAt(), reactions);
    }
}
