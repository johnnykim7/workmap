package com.therecommerce.workmap.chat.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.chat.domain.ChatReaction;
import com.therecommerce.workmap.chat.dto.ChatDtos.ReactionSummary;
import com.therecommerce.workmap.chat.mapper.ChatMessageMapper;
import com.therecommerce.workmap.chat.mapper.ChatReactionMapper;
import com.therecommerce.workmap.chat.mapper.ChatReplyMapper;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 이모지 리액션 토글 서비스 (CR-025).
 * 같은 (대상, 사용자, 이모지)가 있으면 삭제, 없으면 추가. 토글 후 전체 요약을 반환.
 */
@Service
@RequiredArgsConstructor
public class ChatReactionService {

    private final ChatReactionMapper reactionMapper;
    private final ChatMessageMapper messageMapper;
    private final ChatReplyMapper replyMapper;

    /** 메시지 리액션 토글 → 해당 메시지 전체 리액션 요약 반환. */
    @Transactional
    public List<ReactionSummary> toggleMessageReaction(Long messageId, Long userId, String emoji) {
        if (messageMapper.findById(messageId) == null) {
            throw new BusinessException(WmpErrorCode.CHAT_MESSAGE_NOT_FOUND);
        }
        ChatReaction existing = reactionMapper.findByMessageUserEmoji(messageId, userId, emoji);
        if (existing != null) {
            reactionMapper.deleteById(existing.getId());
        } else {
            reactionMapper.insert(ChatReaction.builder()
                    .messageId(messageId).replyId(null).userId(userId).emoji(emoji).build());
        }
        return ChatReactionSummaryHelper.summarize(reactionMapper.findByMessageId(messageId));
    }

    /** 답글 리액션 토글 → 해당 답글 전체 리액션 요약 반환. */
    @Transactional
    public List<ReactionSummary> toggleReplyReaction(Long replyId, Long userId, String emoji) {
        if (replyMapper.findById(replyId) == null) {
            throw new BusinessException(WmpErrorCode.CHAT_REPLY_NOT_FOUND);
        }
        ChatReaction existing = reactionMapper.findByReplyUserEmoji(replyId, userId, emoji);
        if (existing != null) {
            reactionMapper.deleteById(existing.getId());
        } else {
            reactionMapper.insert(ChatReaction.builder()
                    .messageId(null).replyId(replyId).userId(userId).emoji(emoji).build());
        }
        return ChatReactionSummaryHelper.summarize(reactionMapper.findByReplyId(replyId));
    }
}
