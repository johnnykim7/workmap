package com.therecommerce.workmap.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * AI 업무 초안(aimbase) 연동 설정(WMP-WI-019, CR-050). application.yml {@code workmap.aimbase.*}.
 * apiKey·워크플로 id는 운영 env로 주입 — 소스 미커밋. 빈 등록은 {@code @ConfigurationPropertiesScan}.
 *
 * <p>WorkMap → aimbase 아웃바운드: 워크플로 run + 폴링으로 Epic/Story/Task 구조를 받아 draft로 생성한다.
 */
@ConfigurationProperties(prefix = "workmap.aimbase")
@Getter
@Setter
public class AiDraftProperties {

    /** aimbase Base URL(운영). */
    private String baseUrl = "http://59.8.160.12:8280";

    /** aimbase 시스템 API Key — X-API-Key 헤더. env(WMP_AIMBASE_KEY) 주입. 비어 있으면 초안 API가 미설정 응답. */
    private String apiKey = "";

    /** aimbase 테넌트 식별자 — X-Tenant-Id 헤더(운영 필수, 실측). env(WMP_AIMBASE_TENANT) 주입. */
    private String tenantId = "workmap";

    /** "서술 → Epic 초안" 워크플로 id(mode=epic). */
    private String epicWorkflowId = "";

    /** "서술 → 지정 Epic 하위 Story·Task 초안" 워크플로 id(mode=story-task). */
    private String storyTaskWorkflowId = "";

    /** 실행 결과 폴링 간격(ms). */
    private long pollIntervalMs = 3000;

    /** 실행 결과 폴링 최대 시도 횟수(초과 시 타임아웃). */
    private int pollMaxAttempts = 20;

    /** apiKey·워크플로 id가 모두 설정됐는지(미설정이면 초안 API가 NOT_CONFIGURED 안내). */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank()
                && epicWorkflowId != null && !epicWorkflowId.isBlank()
                && storyTaskWorkflowId != null && !storyTaskWorkflowId.isBlank();
    }
}
