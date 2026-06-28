package com.therecommerce.workmap.notification.service;

import com.therecommerce.workmap.invitation.service.NotificationClient;
import com.therecommerce.workmap.notification.domain.NotificationType;
import com.therecommerce.workmap.user.domain.User;
import com.therecommerce.workmap.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * bp-notification 외부 알림 게이트웨이(WMP-NOTI-004, CR-028). {@link NotificationGateway} 구현.
 *
 * <p>이 빈이 등록되면 {@link NotificationGatewayConfig}의 {@code @ConditionalOnMissingBean}에 의해
 * {@link NoopNotificationGateway}를 대체한다. 이메일/푸시 발송은 CR-027 {@link NotificationClient}를
 * 공유(동일 솔루션·apiKey·RestClient) — 클라이언트를 중복 생성하지 않는다.
 *
 * <p>모든 발송은 best-effort(NotificationClient가 예외를 삼킴). 종류별 템플릿코드는 {@code WMP_NOTI_{TYPE}}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BpNotificationGateway implements NotificationGateway {

    private final NotificationClient client;
    private final UserMapper userMapper;

    @Override
    public void sendEmail(Long recipientId, NotificationType type, Map<String, String> variables) {
        User user = userMapper.findById(recipientId);
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return;  // 이메일 주소 없음 — 발송 불가
        }
        client.sendEmail(user.getEmail(), templateCode(type), enrich(variables, user));
    }

    @Override
    public void sendPush(Long recipientId, NotificationType type, Map<String, String> variables) {
        // bp-notification이 userId의 등록 기기(FCM)로 발송 — WorkMap이 토큰을 직접 다루지 않는다.
        client.sendPush(recipientId, templateCode(type), variables == null ? Map.of() : variables);
    }

    /** 종류 → bp-notification 템플릿코드. 사전 등록 필요(미등록 종류는 bp-notification이 거부 → best-effort 무시). */
    private String templateCode(NotificationType type) {
        return "WMP_NOTI_" + type.name();
    }

    /** 템플릿 변수에 수신자 이름 보강(없으면 추가). */
    private Map<String, String> enrich(Map<String, String> variables, User user) {
        Map<String, String> v = new HashMap<>(variables == null ? Map.of() : variables);
        v.putIfAbsent("userName", user.getName() == null ? "" : user.getName());
        return v;
    }
}
