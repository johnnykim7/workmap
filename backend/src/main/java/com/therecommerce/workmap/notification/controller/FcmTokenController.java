package com.therecommerce.workmap.notification.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.notification.dto.FcmTokenDtos;
import com.therecommerce.workmap.notification.service.FcmTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * FCM 기기 토큰 API (T3-2 L, WMP-NOTI-004, CR-028). 본인 토큰만 등록/삭제.
 * 로그인 시 register, 로그아웃 시 delete. userId는 인증 토큰에서 주입.
 */
@RestController
@RequestMapping("/api/v1/fcm/token")
@RequiredArgsConstructor
public class FcmTokenController {

    private final FcmTokenService service;

    /** FCM 토큰 등록(로그인 시). */
    @PostMapping
    public ResponseDto<Void> register(@Valid @RequestBody FcmTokenDtos.RegisterRequest req,
                                      @AuthUserInfo("userId") Long userId) {
        service.register(userId, req.fcmToken(), req.deviceInfo());
        return ResponseDto.success(null);
    }

    /** FCM 토큰 삭제(로그아웃 시). */
    @DeleteMapping
    public ResponseDto<Void> delete(@Valid @RequestBody FcmTokenDtos.DeleteRequest req,
                                    @AuthUserInfo("userId") Long userId) {
        service.delete(userId, req.fcmToken());
        return ResponseDto.success(null);
    }
}
