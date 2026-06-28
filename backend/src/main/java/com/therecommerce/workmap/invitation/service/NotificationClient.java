package com.therecommerce.workmap.invitation.service;

import com.therecommerce.workmap.invitation.config.NotificationProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * bp-notification 발송 클라이언트 (WMP-AUTH-009 CR-027 / WMP-NOTI-004 CR-028).
 * {@code POST /api/v1/messages/email}·{@code /messages/push}·{@code /fcm/token} (X-API-Key) 호출.
 * 발송은 best-effort — 실패가 호출 트랜잭션을 롤백시키지 않도록 예외를 삼키고 로깅한다.
 * 인증번호 등 민감값 평문은 로그에 남기지 않는다(수신자·템플릿 코드만 기록).
 */
@Slf4j
@Component
public class NotificationClient {

    private final NotificationProperties props;
    private final RestClient restClient;

    public NotificationClient(NotificationProperties props) {
        this.props = props;
        this.restClient = RestClient.builder()
                .baseUrl(props.getBaseUrl())
                .build();
    }

    /**
     * 인증번호 이메일 발송. variables에 인증번호({{code}}) 등 포함.
     * @return 발송 성공 여부(실패해도 예외를 던지지 않음 — best-effort)
     */
    public boolean sendEmail(String email, String templateCode, Map<String, String> variables) {
        if (!props.isEnabled() || props.getApiKey() == null || props.getApiKey().isBlank()) {
            log.warn("[notification] 발송 비활성/apiKey 미설정 — 스킵. template={} to={}", templateCode, email);
            return false;
        }
        try {
            restClient.post()
                    .uri("/api/v1/messages/email")
                    .header("X-API-Key", props.getApiKey())
                    .header("Content-Type", "application/json")
                    .body(Map.of("email", email, "templateCode", templateCode, "variables", variables))
                    .retrieve()
                    .toBodilessEntity();
            log.info("[notification] 이메일 발송 요청 OK. template={} to={}", templateCode, email);
            return true;
        } catch (Exception e) {
            // best-effort: 발송 실패가 OTP 발급/초대 트랜잭션을 막지 않는다.
            log.error("[notification] 이메일 발송 실패(무시). template={} to={} err={}",
                    templateCode, email, e.getMessage());
            return false;
        }
    }

    /**
     * 푸시 발송(WMP-NOTI-004, CR-028). bp-notification이 userId의 등록 기기(FCM)로 전송한다.
     * @return 발송 성공 여부(실패해도 예외 안 던짐 — best-effort)
     */
    public boolean sendPush(Long userId, String templateCode, Map<String, String> variables) {
        if (!enabled()) {
            log.warn("[notification] 푸시 비활성/apiKey 미설정 — 스킵. template={} userId={}", templateCode, userId);
            return false;
        }
        try {
            restClient.post()
                    .uri("/api/v1/messages/push")
                    .header("X-API-Key", props.getApiKey())
                    .header("Content-Type", "application/json")
                    .body(Map.of("userId", userId, "templateCode", templateCode, "variables", variables))
                    .retrieve()
                    .toBodilessEntity();
            log.info("[notification] 푸시 발송 요청 OK. template={} userId={}", templateCode, userId);
            return true;
        } catch (Exception e) {
            log.error("[notification] 푸시 발송 실패(무시). template={} userId={} err={}",
                    templateCode, userId, e.getMessage());
            return false;
        }
    }

    /** FCM 토큰 등록 위임(WMP-NOTI-004, CR-028). bp-notification이 userId↔토큰을 보유해야 푸시 가능. */
    public boolean registerFcmToken(Long userId, String fcmToken, String deviceInfo) {
        if (!enabled()) {
            return false;
        }
        try {
            restClient.post()
                    .uri("/api/v1/fcm/token")
                    .header("X-API-Key", props.getApiKey())
                    .header("Content-Type", "application/json")
                    .body(Map.of("userId", userId, "fcmToken", fcmToken,
                            "deviceInfo", deviceInfo == null ? "" : deviceInfo))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (Exception e) {
            log.error("[notification] FCM 토큰 등록 위임 실패(무시). userId={} err={}", userId, e.getMessage());
            return false;
        }
    }

    /** FCM 토큰 삭제 위임(로그아웃 시). */
    public boolean deleteFcmToken(Long userId, String fcmToken) {
        if (!enabled()) {
            return false;
        }
        try {
            restClient.method(org.springframework.http.HttpMethod.DELETE)
                    .uri("/api/v1/fcm/token")
                    .header("X-API-Key", props.getApiKey())
                    .header("Content-Type", "application/json")
                    .body(Map.of("userId", userId, "fcmToken", fcmToken))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (Exception e) {
            log.error("[notification] FCM 토큰 삭제 위임 실패(무시). userId={} err={}", userId, e.getMessage());
            return false;
        }
    }

    private boolean enabled() {
        return props.isEnabled() && props.getApiKey() != null && !props.getApiKey().isBlank();
    }
}
