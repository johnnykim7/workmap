package com.therecommerce.workmap.notification.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.notification.dto.NotificationPreferenceDtos;
import com.therecommerce.workmap.notification.service.NotificationPreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 알림 수신 설정 API (T3-2 L, WMP-NOTI-003, CR-028). 본인 설정만 조회/갱신.
 */
@RestController
@RequestMapping("/api/v1/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferenceService service;

    /** 내 알림 수신 설정(종류 × 채널, 미설정은 기본값 머지). */
    @GetMapping
    public ResponseDto<NotificationPreferenceDtos.ListResponse> list(
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(service.list(userId));
    }

    /** 수신 설정 부분 upsert(보낸 종류만). */
    @PutMapping
    public ResponseDto<Void> update(@Valid @RequestBody NotificationPreferenceDtos.UpdateRequest req,
                                    @AuthUserInfo("userId") Long userId) {
        service.update(userId, req);
        return ResponseDto.success(null);
    }
}
