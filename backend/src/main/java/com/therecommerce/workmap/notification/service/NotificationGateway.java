package com.therecommerce.workmap.notification.service;

import com.therecommerce.workmap.notification.domain.NotificationType;

import java.util.Map;

/**
 * 외부 알림 전달 게이트웨이(WMP-NOTI-004, CR-028). 인앱 알림을 이메일/푸시로 fan-out.
 *
 * <p>인터페이스 바인딩: {@link NotificationDispatcher}는 이 계약만 보고 호출한다. 실제 전달은
 * bp-notification 클라이언트 어댑터가 구현한다(CR-028 (B) 단계 — CR-027 {@code NotificationClient}
 * 공유·확장). (B) 미배선 동안은 {@link NoopNotificationGateway}가 대신 등록되어 외부 전달을 생략한다.
 *
 * <p>모든 메서드는 best-effort — 실패가 인앱 기록/트랜잭션을 막지 않도록 구현체에서 격리한다.
 */
public interface NotificationGateway {

    /** 수신자 이메일로 알림 전달. */
    void sendEmail(Long recipientId, NotificationType type, Map<String, String> variables);

    /** 수신자의 등록 기기로 푸시 전달. */
    void sendPush(Long recipientId, NotificationType type, Map<String, String> variables);
}
