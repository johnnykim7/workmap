package com.therecommerce.workmap.chat.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.chat.dto.ChatDtos.*;
import com.therecommerce.workmap.chat.service.ChatEnhancedService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 핀 / 북마크 / 알림설정 / 멘션 API (CR-025). 모두 인증 필요(🔒).
 * 핀·북마크는 토글(결과 boolean: true=핀됨/추가됨).
 */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatEnhancedController {

    private final ChatEnhancedService enhancedService;

    // ── 핀 ──────────────────────────────────────────────────────────────
    @GetMapping("/channels/{channelId}/pins")
    public ResponseDto<List<PinResponse>> listPins(@PathVariable Long channelId) {
        return ResponseDto.success(enhancedService.listPins(channelId));
    }

    @PostMapping("/channels/{channelId}/messages/{messageId}/pin")
    public ResponseDto<Boolean> togglePin(@PathVariable Long channelId,
                                          @PathVariable Long messageId,
                                          @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(enhancedService.togglePin(channelId, messageId, userId));
    }

    @DeleteMapping("/channels/{channelId}/messages/{messageId}/pin")
    public ResponseDto<Void> removePin(@PathVariable Long channelId,
                                       @PathVariable Long messageId) {
        enhancedService.removePin(channelId, messageId);
        return ResponseDto.success(null);
    }

    // ── 북마크 ──────────────────────────────────────────────────────────
    @GetMapping("/bookmarks")
    public ResponseDto<List<BookmarkResponse>> listBookmarks(@AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(enhancedService.listBookmarks(userId));
    }

    @PostMapping("/bookmarks/{messageId}")
    public ResponseDto<Boolean> toggleBookmark(@PathVariable Long messageId,
                                               @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(enhancedService.toggleBookmark(userId, messageId));
    }

    @DeleteMapping("/bookmarks/{messageId}")
    public ResponseDto<Void> removeBookmark(@PathVariable Long messageId,
                                            @AuthUserInfo("userId") Long userId) {
        enhancedService.removeBookmark(userId, messageId);
        return ResponseDto.success(null);
    }

    // ── 알림 설정 ───────────────────────────────────────────────────────
    @GetMapping("/channels/{channelId}/notification-settings")
    public ResponseDto<NotificationSettingResponse> getNotificationSetting(
            @PathVariable Long channelId,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(enhancedService.getNotificationSetting(channelId, userId));
    }

    @PutMapping("/channels/{channelId}/notification-settings")
    public ResponseDto<NotificationSettingResponse> upsertNotificationSetting(
            @PathVariable Long channelId,
            @RequestBody NotificationSettingRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(
                enhancedService.upsertNotificationSetting(channelId, userId, req));
    }

    // ── 멘션 ────────────────────────────────────────────────────────────
    @GetMapping("/mentions/me")
    public ResponseDto<List<MentionResponse>> listMyMentions(@AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(enhancedService.listMyMentions(userId));
    }
}
