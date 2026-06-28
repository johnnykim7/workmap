package com.therecommerce.workmap.notification.service;

import com.therecommerce.workmap.notification.domain.Notification;
import com.therecommerce.workmap.notification.domain.NotificationPreference;
import com.therecommerce.workmap.notification.domain.NotificationType;
import com.therecommerce.workmap.notification.mapper.NotificationMapper;
import com.therecommerce.workmap.notification.mapper.NotificationPreferenceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * 알림 발행 단일 진입점(WMP-NOTI-002, CR-028). 모든 알림은 여기를 거친다:
 * <ol>
 *   <li>인앱 받은함 insert — <b>항상</b>(원장 보존, 사용자 설정과 무관)</li>
 *   <li>수신 설정 조회 — 행이 없으면 시스템 기본값(인앱 ON·이메일 OFF·푸시 OFF)</li>
 *   <li>email/push가 ON인 채널만 {@link NotificationGateway}로 fan-out(best-effort 비동기)</li>
 * </ol>
 *
 * <p>인터페이스 바인딩: 발행 출처(리스너·스케줄러)는 Dispatcher만 호출하고 채널 분기를 모른다.
 * 외부 전달 실패는 Gateway 구현체가 격리하므로 인앱 기록·호출 트랜잭션에 전파되지 않는다.
 */
@Component
@RequiredArgsConstructor
public class NotificationDispatcher {

    private final NotificationMapper notificationMapper;
    private final NotificationPreferenceMapper preferenceMapper;
    private final NotificationGateway gateway;

    /** 인앱 기록 + 설정 기반 외부 fan-out. */
    public void dispatch(Long recipientId, NotificationType type, Long workItemId, String message) {
        dispatch(recipientId, type, workItemId, message, Map.of());
    }

    /**
     * @param variables 외부 템플릿 변수(title/projectName/actorName/link 등). 인앱 메시지에는 쓰지 않는다.
     */
    public void dispatch(Long recipientId, NotificationType type, Long workItemId,
                         String message, Map<String, String> variables) {
        if (recipientId == null) {
            return;
        }
        // 1) 인앱 원장 — 항상 기록
        notificationMapper.insert(Notification.builder()
                .recipientId(recipientId)
                .type(type.name())
                .workItemId(workItemId)
                .message(message)
                .isRead(false)
                .build());

        // 2) 수신 설정 — 없으면 기본값(인앱 ON·외부 OFF)
        NotificationPreference pref = preferenceMapper.findByUserAndType(recipientId, type.name());
        boolean email = pref != null && pref.isEmail();
        boolean push = pref != null && pref.isPush();

        // 3) 외부 fan-out — ON인 채널만(best-effort, Gateway가 실패 격리)
        if (email || push) {
            // 인앱 메시지·업무ID를 외부 템플릿 변수로도 전달({{message}}/{{workItemId}}).
            Map<String, String> vars = new HashMap<>(variables == null ? Map.of() : variables);
            vars.putIfAbsent("message", message == null ? "" : message);
            if (workItemId != null) {
                vars.putIfAbsent("workItemId", String.valueOf(workItemId));
            }
            if (email) {
                gateway.sendEmail(recipientId, type, vars);
            }
            if (push) {
                gateway.sendPush(recipientId, type, vars);
            }
        }
    }
}
