package com.therecommerce.workmap.notification.controller;

import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.notification.dto.NotificationDtos;
import com.therecommerce.workmap.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 알림 받은함 API (T3-2 I, WMP-NOTI-001). 모두 인증 필요(🔒) — 본인 알림만 조회/읽음.
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** 알림 목록(읽음/안읽음 필터). */
    @GetMapping
    public ResponseDto<PageResponse<NotificationDtos.Response>> list(
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(
                notificationService.list(userId, isRead, new PageRequest(page, size)));
    }

    /** 안 읽은 알림 개수(받은함 배지). */
    @GetMapping("/unread-count")
    public ResponseDto<Long> unreadCount(@AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(notificationService.unreadCount(userId));
    }

    /** 알림 읽음 처리. */
    @PatchMapping("/{id}/read")
    public ResponseDto<Void> markRead(@PathVariable Long id,
                                      @AuthUserInfo("userId") Long userId) {
        notificationService.markRead(id, userId);
        return ResponseDto.success(null);
    }
}
