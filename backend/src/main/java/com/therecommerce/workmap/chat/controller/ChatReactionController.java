package com.therecommerce.workmap.chat.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.chat.dto.ChatDtos.ReactionRequest;
import com.therecommerce.workmap.chat.dto.ChatDtos.ReactionSummary;
import com.therecommerce.workmap.chat.service.ChatReactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 이모지 리액션 토글 API (CR-025). 메시지/답글 대상. 모두 인증 필요(🔒).
 * 토글 후 해당 대상의 전체 리액션 요약을 반환.
 */
@RestController
@RequestMapping("/api/v1/chat/channels/{channelId}")
@RequiredArgsConstructor
public class ChatReactionController {

    private final ChatReactionService reactionService;

    @PostMapping("/messages/{messageId}/reactions")
    public ResponseDto<List<ReactionSummary>> toggleMessageReaction(
            @PathVariable Long channelId,
            @PathVariable Long messageId,
            @RequestBody ReactionRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(
                reactionService.toggleMessageReaction(messageId, userId, req.emoji()));
    }

    @PostMapping("/messages/{messageId}/replies/{replyId}/reactions")
    public ResponseDto<List<ReactionSummary>> toggleReplyReaction(
            @PathVariable Long channelId,
            @PathVariable Long messageId,
            @PathVariable Long replyId,
            @RequestBody ReactionRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(
                reactionService.toggleReplyReaction(replyId, userId, req.emoji()));
    }
}
