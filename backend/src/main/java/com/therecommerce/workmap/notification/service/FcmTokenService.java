package com.therecommerce.workmap.notification.service;

import com.therecommerce.workmap.invitation.service.NotificationClient;
import com.therecommerce.workmap.notification.domain.FcmToken;
import com.therecommerce.workmap.notification.mapper.FcmTokenMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FCM 기기 토큰 서비스(WMP-NOTI-004, CR-028). 로그인 시 등록·로그아웃 시 삭제.
 * 자체 fcm_tokens에 보관 + bp-notification에 미러 위임(best-effort) — 푸시 발송은 bp-notification이
 * userId 기준으로 그 토큰들에 보낸다.
 */
@Service
@RequiredArgsConstructor
public class FcmTokenService {

    private final FcmTokenMapper mapper;
    private final NotificationClient notificationClient;

    /** 토큰 등록(중복 무시) + bp-notification 미러 위임. */
    @Transactional
    public void register(Long userId, String fcmToken, String deviceInfo) {
        mapper.insertIgnore(FcmToken.builder()
                .userId(userId)
                .fcmToken(fcmToken)
                .deviceInfo(deviceInfo)
                .build());
        notificationClient.registerFcmToken(userId, fcmToken, deviceInfo);  // best-effort
    }

    /** 토큰 삭제(본인 것만) + bp-notification 미러 삭제. */
    @Transactional
    public void delete(Long userId, String fcmToken) {
        mapper.delete(userId, fcmToken);
        notificationClient.deleteFcmToken(userId, fcmToken);  // best-effort
    }
}
