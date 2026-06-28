package com.therecommerce.workmap.chat.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.chat.dto.ChatDtos.*;
import com.therecommerce.workmap.chat.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 메시지 / 답글 API (CR-025). 채널 하위 리소스. 모두 인증 필요(🔒).
 * 수정/삭제는 작성자 본인만(서비스에서 author_id 검증).
 */
@RestController
@RequestMapping("/api/v1/chat/channels/{channelId}")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService messageService;

    // ── 메시지 ──────────────────────────────────────────────────────────
    @GetMapping("/messages")
    public ResponseDto<List<MessageResponse>> listMessages(@PathVariable Long channelId) {
        return ResponseDto.success(messageService.listMessages(channelId));
    }

    @PostMapping("/messages")
    public ResponseDto<MessageResponse> createMessage(@PathVariable Long channelId,
                                                      @RequestBody MessageCreateRequest req,
                                                      @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(messageService.createMessage(channelId, req, userId));
    }

    @PutMapping("/messages/{messageId}")
    public ResponseDto<MessageResponse> updateMessage(@PathVariable Long channelId,
                                                      @PathVariable Long messageId,
                                                      @RequestBody MessageUpdateRequest req,
                                                      @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(messageService.updateMessage(messageId, req, userId));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseDto<Void> deleteMessage(@PathVariable Long channelId,
                                           @PathVariable Long messageId,
                                           @AuthUserInfo("userId") Long userId) {
        messageService.deleteMessage(messageId, userId);
        return ResponseDto.success(null);
    }

    // ── 답글 ────────────────────────────────────────────────────────────
    @GetMapping("/messages/{messageId}/replies")
    public ResponseDto<List<ReplyResponse>> listReplies(@PathVariable Long channelId,
                                                        @PathVariable Long messageId) {
        return ResponseDto.success(messageService.listReplies(messageId));
    }

    @PostMapping("/messages/{messageId}/replies")
    public ResponseDto<ReplyResponse> createReply(@PathVariable Long channelId,
                                                  @PathVariable Long messageId,
                                                  @RequestBody ReplyCreateRequest req,
                                                  @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(messageService.createReply(messageId, req, userId));
    }

    @PutMapping("/messages/{messageId}/replies/{replyId}")
    public ResponseDto<ReplyResponse> updateReply(@PathVariable Long channelId,
                                                  @PathVariable Long messageId,
                                                  @PathVariable Long replyId,
                                                  @RequestBody ReplyUpdateRequest req,
                                                  @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(messageService.updateReply(replyId, req, userId));
    }

    @DeleteMapping("/messages/{messageId}/replies/{replyId}")
    public ResponseDto<Void> deleteReply(@PathVariable Long channelId,
                                         @PathVariable Long messageId,
                                         @PathVariable Long replyId,
                                         @AuthUserInfo("userId") Long userId) {
        messageService.deleteReply(replyId, userId);
        return ResponseDto.success(null);
    }
}
