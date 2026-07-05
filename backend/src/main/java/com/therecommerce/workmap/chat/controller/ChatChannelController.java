package com.therecommerce.workmap.chat.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.chat.dto.ChatDtos.*;
import com.therecommerce.workmap.chat.service.ChatChannelService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
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

    // 채널 CRUD는 WS 설정 성격 — 전사 Admin만(POL-014, CR-046 가드 보강).
    // 메시지/리액션/읽음커서 등 소통 행위는 무가드 유지(WS 멤버 전원).
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<ChannelResponse> create(@RequestBody ChannelCreateRequest req,
                                               @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(channelService.create(req, userId));
    }

    @PutMapping("/{channelId}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<ChannelResponse> update(@PathVariable Long channelId,
                                               @RequestBody ChannelUpdateRequest req) {
        return ResponseDto.success(channelService.update(channelId, req));
    }

    @DeleteMapping("/{channelId}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
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
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<Void> addMember(@PathVariable Long channelId,
                                       @RequestBody MemberAddRequest req) {
        channelService.addMember(channelId, req.userId());
        return ResponseDto.success(null);
    }

    @DeleteMapping("/{channelId}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<Void> removeMember(@PathVariable Long channelId,
                                          @PathVariable Long userId) {
        channelService.removeMember(channelId, userId);
        return ResponseDto.success(null);
    }
}
