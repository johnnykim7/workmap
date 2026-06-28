package com.therecommerce.workmap.chat.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.chat.dto.ChatDtos.*;
import com.therecommerce.workmap.chat.service.ChatChannelService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 채널 / 멤버 / 읽음커서 API (CR-025, 커뮤니케이션 모듈). 모두 인증 필요(🔒).
 * workspaceId 는 별도 주입 어노테이션이 없어 쿼리/바디로 받는다.
 */
@RestController
@RequestMapping("/api/v1/chat/channels")
@RequiredArgsConstructor
public class ChatChannelController {

    private final ChatChannelService channelService;

    // ── 채널 ────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseDto<List<ChannelResponse>> list(@RequestParam Long workspaceId,
                                                    @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(channelService.list(workspaceId, userId));
    }

    @GetMapping("/{channelId}")
    public ResponseDto<ChannelResponse> get(@PathVariable Long channelId,
                                            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(channelService.get(channelId, userId));
    }

    @PostMapping
    public ResponseDto<ChannelResponse> create(@RequestBody ChannelCreateRequest req,
                                               @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(channelService.create(req, userId));
    }

    @PutMapping("/{channelId}")
    public ResponseDto<ChannelResponse> update(@PathVariable Long channelId,
                                               @RequestBody ChannelUpdateRequest req) {
        return ResponseDto.success(channelService.update(channelId, req));
    }

    @DeleteMapping("/{channelId}")
    public ResponseDto<Void> delete(@PathVariable Long channelId) {
        channelService.delete(channelId);
        return ResponseDto.success(null);
    }

    // ── 읽음 커서 ───────────────────────────────────────────────────────
    @PutMapping("/{channelId}/read-cursor")
    public ResponseDto<Void> updateReadCursor(@PathVariable Long channelId,
                                              @RequestBody ReadCursorRequest req,
                                              @AuthUserInfo("userId") Long userId) {
        channelService.updateReadCursor(channelId, userId, req.lastReadMessageId());
        return ResponseDto.success(null);
    }

    // ── 멤버 ────────────────────────────────────────────────────────────
    @GetMapping("/{channelId}/members")
    public ResponseDto<List<MemberResponse>> listMembers(@PathVariable Long channelId) {
        return ResponseDto.success(channelService.listMembers(channelId));
    }

    @PostMapping("/{channelId}/members")
    public ResponseDto<Void> addMember(@PathVariable Long channelId,
                                       @RequestBody MemberAddRequest req) {
        channelService.addMember(channelId, req.userId());
        return ResponseDto.success(null);
    }

    @DeleteMapping("/{channelId}/members/{userId}")
    public ResponseDto<Void> removeMember(@PathVariable Long channelId,
                                          @PathVariable Long userId) {
        channelService.removeMember(channelId, userId);
        return ResponseDto.success(null);
    }
}
