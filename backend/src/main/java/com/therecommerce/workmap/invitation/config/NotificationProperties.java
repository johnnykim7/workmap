package com.therecommerce.workmap.invitation.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * bp-notification 연동 설정(WMP-AUTH-009, CR-027). application.yml {@code workmap.notification.*}.
 * apiKey는 운영 env(WMP_NOTI_API_KEY)로 주입 — 소스 미커밋. 빈 등록은 {@code @ConfigurationPropertiesScan}.
 */
@ConfigurationProperties(prefix = "workmap.notification")
@Getter
@Setter
public class NotificationProperties {

    /** bp-notification Base URL. 기본 운영 주소. */
    private String baseUrl = "http://59.8.160.12:8185";

    /** 소비앱(solutionCode=WMP) API Key — X-API-Key 헤더. env 주입. 비어 있으면 발송 스킵. */
    private String apiKey = "";

    /** 발송 활성화. 비활성 시 발송 자체를 건너뜀(로컬/테스트). 기본 true. */
    private boolean enabled = true;

    /**
     * WorkMap FE 베이스 URL — 메일 링크(초대 수락·비번 재설정)의 절대 URL 조립용(CR-027 토큰 보정).
     * 예: http://59.8.160.12:3186 → 링크 = {webBaseUrl}/invite/accept?token=...
     */
    private String webBaseUrl = "http://59.8.160.12:3186";
}
