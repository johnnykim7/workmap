package com.therecommerce.workmap.invitation.service;

import com.therecommerce.workmap.invitation.config.NotificationProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * bp-notification 이메일 발송 클라이언트 (WMP-AUTH-009, CR-027).
 * {@code POST /api/v1/messages/email} (X-API-Key) 호출. 발송은 best-effort —
 * 실패가 인증번호 발급 트랜잭션을 롤백시키지 않도록 예외를 삼키고 로깅한다.
 * 인증번호 평문은 로그에 남기지 않는다(이메일·템플릿 코드만 기록).
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
}
