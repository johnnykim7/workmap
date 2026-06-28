package com.therecommerce.workmap.notification.service;

import com.therecommerce.workmap.notification.domain.FcmToken;
import com.therecommerce.workmap.notification.mapper.FcmTokenMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FCM 기기 토큰 서비스(WMP-NOTI-004, CR-028). 로그인 시 등록·로그아웃 시 삭제.
 * 등록은 bp-notification에도 미러 위임할 수 있으나(best-effort), (B) 단계에서 게이트웨이로 연결한다.
 */
@Service
@RequiredArgsConstructor
public class FcmTokenService {

    private final FcmTokenMapper mapper;

    /** 토큰 등록(중복 무시). */
    @Transactional
    public void register(Long userId, String fcmToken, String deviceInfo) {
        mapper.insertIgnore(FcmToken.builder()
                .userId(userId)
                .fcmToken(fcmToken)
                .deviceInfo(deviceInfo)
                .build());
    }

    /** 토큰 삭제(본인 것만). */
    @Transactional
    public void delete(Long userId, String fcmToken) {
        mapper.delete(userId, fcmToken);
    }
}
