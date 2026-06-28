package com.therecommerce.workmap.notification.service;

import com.therecommerce.workmap.notification.domain.NotificationType;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

/**
 * 외부 전달 미배선(CR-028 (B) 단계 전) 기본 게이트웨이. 인앱 알림은 정상 기록되고
 * 외부(이메일/푸시) 전달만 생략한다. bp-notification 어댑터({@link NotificationGateway} 구현)가
 * 빈으로 등록되면 {@link NotificationGatewayConfig}의 {@code @ConditionalOnMissingBean}으로 자동 대체된다.
 */
@Slf4j
public class NoopNotificationGateway implements NotificationGateway {

    @Override
    public void sendEmail(Long recipientId, NotificationType type, Map<String, String> variables) {
        log.debug("[noti] email skip (gateway not wired) recipient={} type={}", recipientId, type);
    }

    @Override
    public void sendPush(Long recipientId, NotificationType type, Map<String, String> variables) {
        log.debug("[noti] push skip (gateway not wired) recipient={} type={}", recipientId, type);
    }
}
