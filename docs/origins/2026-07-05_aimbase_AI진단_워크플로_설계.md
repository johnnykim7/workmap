# WorkMap AI 건강 진단 — aimbase 워크플로 설계 (CR-043, WMP-HOME-015)

> AI 트랙. 구현은 다음 세션. 통계 예측(Monte Carlo)=BE, **서술 진단·요약·조기경보=aimbase**.
> 가이드: `~/Documents/GitHub/bp-platform/aimbase/docs/guides/aimbase-api-guide.md`

## 1. 역할 분리 (과설계 방지)

| 유형 | 방식 | 담당 |
|---|---|---|
| Monte Carlo 완료 예측("85% 확률 N건") | throughput 이력 통계 시뮬레이션 | **BE** |
| Forecast Accuracy | 예측vs실제 산술 | **BE** |
| 건강 진단(왜 위험한가·뭘 해야 하나) | 지표 종합 → 자연어 진단 | **aimbase** |
| 주간 요약(대표용) | 전 지표 → 요약·의사결정 항목 | **aimbase** |
| 조기경보(이 추세면 지연) | aging·번다운 패턴 → 서술 예측 | **aimbase** |

## 2. aimbase 연동 스펙 (가이드 실측)

- **인증**: `X-Api-Key` 시스템 키. `domainApp=workmap`.
- **워크플로**: `POST /api/v1/workflows`(생성) → 실행. 스텝 타입 `LLM_CALL`(connection_id·system·prompt·response_schema), `ROUTER`, `EVALUATOR_LOOP` 등.
- **구조화 출력**: `response_schema`(JSON Schema)로 진단 결과를 구조화 수신 → WorkMap이 파싱 없이 사용.
- **라우팅**: LLM_CALL이 Claude CLI 커넥터면 커넥터 `config.agent_name`으로 대상 agent 지정.
- Base URL: 운영 확인 필요(로컬 8080 / Docker 8280). WorkMap BE가 서버-투-서버 호출.

## 3. 워크플로 3종 설계

### 3-1. AI 건강 진단 (WMP-HOME-015a)
- **입력**: 프로젝트 지표 스냅샷(health 축별 status·summary + aging/rework/workload 원시 수치).
- **LLM_CALL system**: "너는 프로젝트 관리 분석가다. 지표를 종합해 건강 판정·위험 원인·권장 액션을 낸다. 숫자를 반복하지 말고 원인과 조치를 말하라."
- **response_schema**:
  ```json
  {
    "verdict": "string (한 줄 판정)",
    "riskCause": "string (근본 원인 추정)",
    "recommendedActions": ["string"],
    "confidence": "number 0~1"
  }
  ```
- **트리거**: 보고서 [건강] 탭 진입 시 or 온디맨드 버튼. 캐시(하루 1회 권장).

### 3-2. AI 주간 요약 (WMP-HOME-015b)
- **입력**: 프로젝트(또는 WS) 지표 + 지난주 대비 델타 + 막힌/재작업/현장검증 실패 항목.
- **출력(response_schema)**: `{ "정상진행": [...], "위험": [...], "의사결정필요": [...], "다음주목표": [...] }` — 대표용 4블록.
- **트리거**: 주간 스케줄 or 버튼. RAG로 과거 요약 참조 가능(선택).

### 3-3. AI 조기경보 (WMP-HOME-015c)
- **입력**: aging 추세·번다운 기울기·throughput 최근 하락·Say-Do 하락.
- **출력**: `{ "riskLevel": "LOW|MED|HIGH", "signal": "string", "affectedItems": [...], "reasoning": "string" }`.
- **트리거**: 스케줄(일별) → riskLevel HIGH면 알림(기존 notification 모듈 연동).

## 4. BE 연동 (다음 세션 구현)

- 신규 `metrics/ai` 서브패키지 or `AiDiagnosisService`.
- aimbase 호출 클라이언트: 기존 bp-notification `NotificationClient`(RestClient) 패턴 재사용 가능.
- 엔드포인트: `POST /projects/{id}/metrics/ai-diagnosis`(온디맨드), 요약·경보는 스케줄러.
- **best-effort**: aimbase 미가용 시 통계 지표만으로 화면 동작(AI 카드만 "진단 불가" 표시).

## 5. FE (다음 세션)

- HealthDashboard 하단에 **AI 진단 카드**(보라 톤): verdict + riskCause + recommendedActions.
- 로딩=스켈레톤, 실패=조용히 숨김(통계 지표는 그대로).

## 6. 미결정 (다음 세션 확인)

- aimbase에 workmap domainApp·커넥터·API Key 발급 여부(운영 확인).
- LLM 커넥터 선택(Claude CLI vs API).
- 주간요약/조기경보 스케줄 주기·알림 연동 범위.
