package com.therecommerce.workmap.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.therecommerce.workmap.ai.config.AiDraftProperties;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * aimbase 워크플로 호출 클라이언트(WMP-WI-019, CR-050). NotificationClient(RestClient) 패턴 재사용.
 * {@code POST /api/v1/workflows/{wfId}/run}으로 실행하고, 비동기라 {@code GET .../runs/{runId}}를 폴링해
 * completed의 최종 stepResults output(구조적 JSON 문자열)을 반환한다.
 *
 * <p>미응답/네트워크/파싱 실패 → AI_DRAFT_UPSTREAM_FAILED(7851). 폴링 초과 → AI_DRAFT_TIMEOUT(7852).
 */
@Slf4j
@Component
public class AiDraftClient {

    private final AiDraftProperties props;
    private final ObjectMapper om;
    private final RestClient restClient;

    public AiDraftClient(AiDraftProperties props, ObjectMapper om) {
        this.props = props;
        this.om = om;
        this.restClient = RestClient.builder()
                .baseUrl(props.getBaseUrl())
                .build();
    }

    /**
     * 워크플로 실행 후 완료까지 폴링하여 최종 output JSON 문자열을 반환.
     * @param workflowId 실행할 aimbase 워크플로 id
     * @param input      워크플로 inputSchema에 맞춘 flat 입력(statement 등)
     * @return 완료 응답에서 추출한 구조적 JSON 문자열({epics:[...]} 또는 {stories:[...]})
     */
    @SuppressWarnings("unchecked")
    public String runAndPoll(String workflowId, Map<String, Object> input) {
        String runId;
        try {
            Map<String, Object> res = restClient.post()
                    .uri("/api/v1/workflows/{wfId}/run", workflowId)
                    .header("X-API-Key", props.getApiKey())
                    .header("Content-Type", "application/json")
                    .body(input)
                    .retrieve()
                    .body(Map.class);
            Map<String, Object> data = asMap(res == null ? null : res.get("data"));
            runId = data == null ? null : str(data.get("id"));
            if (runId == null) {
                throw new BusinessException(WmpErrorCode.AI_DRAFT_UPSTREAM_FAILED,
                        "AI 초안 워크플로 실행 응답에 runId가 없습니다.");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("[ai-draft] 워크플로 실행 실패. wfId={} err={}", workflowId, e.getMessage());
            throw new BusinessException(WmpErrorCode.AI_DRAFT_UPSTREAM_FAILED);
        }

        for (int attempt = 0; attempt < props.getPollMaxAttempts(); attempt++) {
            sleep(props.getPollIntervalMs());
            Map<String, Object> data;
            try {
                Map<String, Object> res = restClient.get()
                        .uri("/api/v1/workflows/runs/{runId}", runId)
                        .header("X-API-Key", props.getApiKey())
                        .retrieve()
                        .body(Map.class);
                data = asMap(res == null ? null : res.get("data"));
            } catch (Exception e) {
                log.error("[ai-draft] 실행 결과 폴링 실패. runId={} err={}", runId, e.getMessage());
                throw new BusinessException(WmpErrorCode.AI_DRAFT_UPSTREAM_FAILED);
            }
            if (data == null) {
                continue;
            }
            String status = str(data.get("status"));
            if ("completed".equals(status)) {
                return extractOutput(data);
            }
            if ("failed".equals(status) || "cancelled".equals(status)) {
                log.error("[ai-draft] 워크플로 종료 상태={}. runId={}", status, runId);
                throw new BusinessException(WmpErrorCode.AI_DRAFT_UPSTREAM_FAILED,
                        "AI 초안 생성이 실패했습니다(" + status + ").");
            }
            // running/pending_approval → 계속 폴링
        }
        throw new BusinessException(WmpErrorCode.AI_DRAFT_TIMEOUT);
    }

    /** 완료 응답 data.stepResults의 마지막 스텝 output(구조적 JSON 문자열)을 추출. */
    private String extractOutput(Map<String, Object> data) {
        Map<String, Object> stepResults = asMap(data.get("stepResults"));
        if (stepResults == null || stepResults.isEmpty()) {
            throw new BusinessException(WmpErrorCode.AI_DRAFT_UPSTREAM_FAILED,
                    "AI 초안 응답에 결과가 없습니다.");
        }
        // 마지막(삽입 순서상) 스텝의 output을 사용 — 단일 LLM 스텝 워크플로 가정.
        Object last = null;
        for (Object v : stepResults.values()) {
            last = v;
        }
        Map<String, Object> step = asMap(last);
        Object output = step == null ? null : step.get("output");
        if (output == null) {
            throw new BusinessException(WmpErrorCode.AI_DRAFT_UPSTREAM_FAILED,
                    "AI 초안 응답 스텝에 output이 없습니다.");
        }
        // output은 JSON 문자열이거나 이미 파싱된 Map일 수 있음 — 문자열로 정규화.
        if (output instanceof String s) {
            return s;
        }
        try {
            return om.writeValueAsString(output);
        } catch (Exception e) {
            throw new BusinessException(WmpErrorCode.AI_DRAFT_UPSTREAM_FAILED, "AI 초안 응답 파싱 실패.");
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) {
        return (o instanceof Map) ? (Map<String, Object>) o : null;
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(WmpErrorCode.AI_DRAFT_UPSTREAM_FAILED, "AI 초안 대기 중 중단되었습니다.");
        }
    }
}
