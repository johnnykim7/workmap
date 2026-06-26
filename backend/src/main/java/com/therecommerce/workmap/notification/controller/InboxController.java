package com.therecommerce.workmap.notification.controller;

import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.notification.dto.InboxDtos;
import com.therecommerce.workmap.notification.service.InboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 받은함 API (T3-2 L, WMP-NOTI-001). 본인에게 온 알림 통합(목록 + 안읽음 배지).
 * /notifications 와 동일 데이터원의 받은함 표현(CR-011) — 인증 필요(🔒).
 */
@RestController
@RequestMapping("/api/v1/inbox")
@RequiredArgsConstructor
public class InboxController {

    private final InboxService inboxService;

    @GetMapping
    public ResponseDto<InboxDtos.Response> inbox(
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(
                inboxService.inbox(userId, isRead, new PageRequest(page, size)));
    }
}
