# WorkMap 변경 이력 (Change Request Log)

> ai-sdlc 템플릿: v2.26.0 기반

> 기능 변경 및 설계 보정을 기록한다. git commit과 별개로, 비즈니스·설계 수준의 변경을 추적한다.
> 이 문서가 변경 이력의 단일 진실 소스이다.

## 전체 요약

| CR 번호 | 변경 제목 | 변경 타입 | 영향도 | 적용 버전 |
|---------|----------|----------|--------|----------|
| CR-000 | 설계 Baseline 동결 (Phase 1) | 신규 | High | v1.0 |
| CR-001 | DB를 PostgreSQL로 확정 | 변경 | Medium | v1.0 |
| CR-002 | FE 목업(ds-ui 기반) 구축 — 12화면 | 신규 | Medium | v1.0 |
| CR-003 | 청사진 전체 메뉴/화면 추가 (이슈·리스크·보고서·Workload) | 신규 | Medium | v1.0 |
| CR-004 | 통합 업무 보기 탭 구조화 + 타임라인·캘린더 (ClickUp/monday 방식) | 변경 | Medium | v1.0 |
| CR-005 | ClickUp 전체 기능 목업 추가 (판단용 전수) | 신규 | High | v1.0 |
| CR-006 | v0.4(Jira 애자일) 전환 — 설계 T1~T3 전면 개정 | 변경 | High | v2.0 |
| CR-007 | Sprint 2 BE 구현 — 인증·사용자·워크스페이스·프로젝트·멤버 | 신규 | High | v2.0 |
| CR-008 | Sprint 4 BE 구현 — 애자일·운영 실행(스프린트/보드/목록/벌크/OPS/승인) | 신규 | High | v2.0 |
| CR-009 | Sprint 5 BE 구현 — 회사홈/보고·관리자 마스터·알림 수신 | 신규 | Medium | v2.0 |
| CR-010 | P2 BE 구현 — 링크·타임라인/캘린더·업무유형 마스터·양식 빌더(+제출) | 신규 | Medium | v2.0 |
| CR-011 | 설계 대비 미구현 BE 3종 마감 — 프로젝트 수정·보관 + 받은함 | 신규 | Medium | v2.0 |
| CR-012 | Phase 2 잔여 BE 3종 — 번다운/번업·벨로시티 + 현장검증 기록 + 저장 필터 | 신규 | Medium | v2.0 |
| CR-017 | 검색 keyword 범위 확장(설명·댓글) — §13.9 충족 BE 보정 | 설계보정 | Low | v2.0 |
| CR-018 | WS 격리 경계 + 진입감 IA — 워크스페이스를 슬랙식 멤버십 격리 경계로 전환(Phase1 설계 전환) | 변경 | High | v2.1 |
| CR-019 | 디폴트 템플릿 + 범용 워크플로 + 탭 `[+]` 추가 + 탭 정합 보정(#13/#14) | 신규/설계보정 | Medium | v2.1 |
| CR-020 | 탭 메뉴(Jira식) — 라벨 DB화 + 프로젝트별 이름 + 기본탭 + 이동/제거 | 신규 | Medium | v2.1 |
| CR-021 | 캘린더 인라인 생성·칩 드래그(Jira식) + 타임라인 월/주 토글 | 신규 | Medium | v2.1 |
| CR-022 | 백로그 Epic 표시 = 평면 + 소속 칩 + 필터 + 인라인 생성 (펼침 트리 폐기) | 설계보정/신규 | Low | v2.1 |
| CR-023 | 타임라인 에픽 WBS 그룹 + 에픽 필터 + 시간단위 4토글(오늘/주/개월/분기, 구간한정+줌) | 신규 | Medium | v2.1 |
| CR-024 | 업무 설명란 Tiptap 리치 에디터 + 로컬 파일 업로드 API | 신규/설계보정 | Medium | v2.1 |
| CR-025 | Jira 스크럼 정합 보정 3종(착수일 자동·라벨 필터·DOC 유형) | 설계보정 | Low | v2.1 |
| CR-026 | 커뮤니케이션(채팅) 모듈 신규 — axopm comm 포팅(워크스페이스 단위 Slack형) | 신규 | High | v2.1 |
| CR-027 | 이메일 초대 가입 + 비밀번호 재설정/변경(인증번호 OTP) + bp-notification 연동 | 신규 | High | v2.2 |
| CR-028 | 각종 알림 확장 — 트리거 발행 구현(댓글·상태·마감·스프린트·승인) + 외부 채널(bp-notification 이메일/푸시) + 수신 설정 | 신규 | High | v2.2 |
| CR-029 | 모바일 앱(Capacitor 래핑) — App Shell 구현 + 푸시/카메라/음성 설계 선기재 | 신규 | Medium | v2.2 |
| CR-030 | 개인 화면 테마 — LNB 톤·포인트색 프리셋 선택(localStorage) | 신규 | Low | v2.2 |
| CR-031 | VIEWER 읽기전용 강제 — 업무·스프린트·승인 쓰기 @PreAuthorize 가드(설계 누락 보정) | 설계보정 | Medium | v2.2 |
| CR-032 | 가입 요청(셀프 신청 → 관리자 승인 → 초대 발송) — signup_requests + 로그인 화면 진입 | 신규 | Medium | v2.2 |
| CR-033 | 초대·가입승인에 워크스페이스 지정 + 수락 시 자동 합류(빈 WS 선택 화면 해소) | 설계보정/신규 | Medium | v2.2 |
| CR-034 | 목록 페이징 상태를 URL(?page=) 소유로 전환(뒤로가기 리셋 버그 보정) | 설계보정 | Medium | v2.2 |
| CR-035 | 타임라인 간트 고도화(SVAR React Gantt — 드래그·의존성선·크리티컬패스) | 변경 | High | v2.3 |
| CR-037 | 첨부 실파일 업로드 전환 + 공통 첨부 컴포넌트·파일 뷰어(그리드/목록·삭제·다운로드·이미지 줌뷰어) | 신규/설계보정 | Medium | v2.3 |
| CR-038 | 스프린트 편집·삭제 (Jira식 편집 폼 + …메뉴 편집/삭제, FUTURE만 삭제·담긴 항목 백로그 복귀) | 신규 | Medium | v2.3 |

---

## 변경 이력

### CR-000 | 설계 Baseline 동결 (Phase 1)
- **대상 기능 ID**: ALL (Phase 1: WMP-AUTH/ORG/PRJ/TSK/VIEW/HOME)
- **변경 타입**: 신규
- **변경 내용**: 제품기획서 v0.3 기반으로 AI-SDLC T1~T3 설계 산출물 + execution-spec 생성. Phase 1(Sprint 1~5) 구현 대상 확정, Phase 2~4 청사진 보존.
- **변경 사유**: 개발 착수 전 설계 동결
- **영향 모듈**: 전체
- **영향도**: High
- **영향 범위**: ALL
- **영향 설계서**: T1-1~T1-8, T2-1, T2-2, T3-1, T3-2, T3-3, T3-5, execution-spec
- **요청자**: 기획 | **승인자**: 사용자(2026-06-19) | **적용 버전**: v1.0
- **변경 일자**: 2026-06-19

### CR-001 | DB를 PostgreSQL로 확정
- **대상 기능 ID**: ALL (BE 영속 계층)
- **변경 타입**: 설계보정
- **변경 내용**: BE DB를 bp-common-lib 공통 표준(MySQL)이 아닌 **PostgreSQL 16**으로 확정(사용자 결정). ORM은 조직 표준 MyBatis 유지(JPA 금지). T2-1/T3-1/CLAUDE.md/T1-2의 DB 타입을 PostgreSQL로 수정(TIMESTAMPTZ, JSONB, IDENTITY, 부분 인덱스).
- **변경 사유**: 사용자 기술 스택 선택. bp-common-lib는 ORM 비의존이라 충돌 없음.
- **영향 모듈**: 전체(BE)
- **영향도**: Medium
- **영향 범위**: ALL (DB 타입·마이그레이션)
- **영향 설계서**: T1-2, T2-1, T3-1, CLAUDE.md
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-19) | **적용 버전**: v1.0
- **변경 일자**: 2026-06-19

### CR-002 | FE 목업(ds-ui 기반) 구축 — 12화면
- **대상 기능 ID**: WMP-AUTH/ORG/PRJ/TSK/VIEW/HOME (Phase 1 FE)
- **변경 타입**: 신규
- **변경 내용**: `frontend/`를 실제 스택(React 19 + Vite + TS + @therecommerce/ds-ui)으로 세팅하고 T3-3 화면구조의 Phase 1 전 화면을 mock 데이터로 구현. 로그인/회사홈/내업무/통합업무/프로젝트목록/프로젝트홈(홈·WBS·칸반 탭)/WBS/칸반/사용자관리/조직설정. 자체 composite: StatusBadge, PriorityBadge, MetricCard, TaskCard, KanbanBoard(T1-5 UI FSM: 낙관적+롤백), WbsTree, TaskDetailSheet. ds-ui는 GitHub가 아닌 로컬 `file:` 링크로 연결. **확정 후 mock→실API 교체로 그대로 실 구현에 활용**.
- **변경 사유**: 사용자 요청 — 화면 목업 전체 제작 후 확정 → BE/FE 순서 구현.
- **영향 모듈**: FE 전체
- **영향도**: Medium (규모: 중규모, 사용자 판단 2026-06-19)
- **영향 범위**: T3-3 전 화면
- **영향 설계서**: T3-3(검증), execution-spec(FE 기반 확보)
- **검증**: `pnpm build` 성공(tsc 전체 타입체크 통과, 2987 모듈), dev 서버 HTTP 200, 전 페이지 변환 200.
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-19) | **적용 버전**: v1.0
- **변경 일자**: 2026-06-19

### CR-003 | 청사진 전체 메뉴/화면 목업 추가 (이슈·리스크·보고서·Workload)
- **대상 기능 ID**: WMP-ISS-001/002, WMP-RISK-001/002, WMP-RPT-002 + Workload(Phase 3)
- **변경 타입**: 신규
- **변경 내용**: 사이드바를 기획서 §15.1 전체 메뉴 구조로 재구성. 이슈(task_type 필터 뷰)·리스크(자동감지 등급)·보고서(주간 요약)·업무분배(Workload) 화면을 목업으로 추가. 프로젝트 메뉴에 목록/홈/WBS 하위 진입점 추가. Phase 2~3 항목은 라벨 '· 준비중' + 페이지 헤더 배지로 구분.
- **변경 사유**: 사용자 피드백 — 메뉴에 이슈·WBS·업무분배 등이 빠져 보임. 목업으로 청사진 전체를 보고 확정하기 위함.
- **영향 모듈**: FE (View/Issue/Risk/보고/Workload)
- **영향도**: Medium
- **영향 범위**: T3-3 화면 구조(메뉴 IA 보강)
- **영향 설계서**: T3-3(메뉴 IA — 추후 반영 필요)
- **검증**: pnpm build 성공(2991 모듈), 신규 4페이지 라우트 200.
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-19) | **적용 버전**: v1.0
- **변경 일자**: 2026-06-19

### CR-004 | 통합 업무 보기 탭 구조화 + 타임라인·캘린더
- **대상 기능 ID**: WMP-VIEW-001/002/005 (+ 캘린더 P2)
- **변경 타입**: 변경
- **변경 내용**: ClickUp·monday 핵심 패턴 적용 — "하나의 업무 데이터를 보기만 전환". 통합 업무 화면을 [목록][칸반][타임라인][캘린더] 보기 탭으로 재구성하고 공통 필터(영역/검색)를 탭 상단에 통합. 타임라인(시간축 막대, 오늘 라인, 지연 강조)·캘린더(월간 마감 그리드) 신규 제작. 칸반은 사이드바 단독 메뉴에서 제거(통합업무·프로젝트 보기 탭으로 흡수, `/board`→`/tasks` 리다이렉트). 프로젝트 홈에도 타임라인 탭 추가. 기획서 §3.1 "하나의 Task, 여러 관점"과 일치.
- **변경 사유**: 사용자 방향 — ClickUp·monday 장점 통합, 현장 관리자·사용자 모두 직관적이어야 함. 타임라인은 기획서 Phase 1인데 누락돼 있던 것을 보강.
- **영향 모듈**: FE (View)
- **영향도**: Medium
- **영향 범위**: T3-3 화면 구조 (보기 IA 변경)
- **영향 설계서**: T3-3(보기 탭 구조 — 추후 반영 필요)
- **검증**: pnpm build 성공(2992 모듈, tsc 통과), /tasks·타임라인·캘린더 변환 200.
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-19) | **적용 버전**: v1.0
- **변경 일자**: 2026-06-19

### CR-005 | ClickUp 전체 기능 목업 추가 (판단용 전수)
- **대상 기능 ID**: (목업 단계 — 정식 기능 ID 미채번. 채택 시 T1-1 반영)
- **변경 타입**: 신규
- **변경 내용**: 사용자 요청 — "모든 기능을 다 목업으로 넣고 보고 판단". ClickUp 전체 기능군을 동작 화면으로 추가. ① 통합 업무 보기 탭 6종(목록/테이블(인라인 편집)/칸반/타임라인/캘린더/박스) ② 작업 상세 확장(의존관계·체크리스트·시간추적·태그·커스텀필드) ③ 목표(OKR)·스프린트/마일스톤·시간추적 ④ 운영(요청폼·승인·반복업무) ⑤ 협업(채팅·받은함·문서·화이트보드) ⑥ 대시보드(위젯)·포트폴리오·커스텀필드 관리 ⑦ 자동화 룰·알림·AI 어시스턴트·외부 연동. 각 항목 헤더에 '청사진/준비중/검토' 표식으로 채택 판단을 돕도록 표시.
- **변경 사유**: ClickUp 대비 무엇을 도입/보류/제외할지 사용자가 직접 보고 판단하기 위함. WorkMap 방향(ClickUp·monday 장점 통합 + 현장 직관성)에 따라 채택 여부는 추후 결정.
- **영향 모듈**: FE 전체 (목업)
- **영향도**: High (화면 다수 추가)
- **영향 범위**: 향후 채택 시 T1-1 기능명세·T3-3 화면구조 대거 반영 예정
- **영향 설계서**: (채택 결정 후 T1-1, T3-3 캐스케이드 — 현재는 목업만)
- **검증**: pnpm build 성공(3001 모듈, tsc 통과), 신규 7페이지+2뷰 컴포넌트 변환 200.
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-19, 목업 단계) | **적용 버전**: v1.0
- **변경 일자**: 2026-06-19
- **주의**: 이것은 **판단용 전수 목업**이며 전부 채택을 의미하지 않는다. 현장 직관성 기준으로 취사선택 예정.
- **보강(2026-06-19)**: 초기 목업이 기능을 21페이지로 압축해 누락이 있어, 빠진 ClickUp 기능을 화면으로 전부 추가. 통합 업무 보기 9종(목록/테이블/칸반/타임라인/캘린더/박스/마인드맵/지도/활동), 도구(템플릿/메모/리마인더/Clips), 플래너, 권한 매트릭스/게스트/프로필, 글로벌 검색(⌘K). 빌드 3006 모듈 통과.
- **보강2(2026-06-19)**: ClickUp 2번 카테고리 미구현 4개 + 계층/의존 연결 추가. ① 개인 우선순위(내 업무 탭, 순번) ② 에픽(스프린트 페이지 탭) ③ 하위폴더(ClickUp식 사이드바 계층 트리: 업무영역>폴더>리스트 펼침) ④ 작업 트레이(화면 하단 도킹). + 의존관계 그래프 뷰(통합업무 10번째 탭: 선행←본인→후행 체인). 통합업무 뷰 10탭, 빌드 3010 모듈 통과.

### CR-006 | v0.4(Jira 애자일) 전환 — 설계 T1~T3 전면 개정
- **대상 기능 ID**: ALL (전 모듈 재편)
- **변경 타입**: 변경 (대규모 — 방법론 재진입)
- **변경 내용**: 제품 방향을 **ClickUp 기반(v0.3) → Jira 애자일 + 물류 현장 특화(v0.4)**로 전환. 정본 = `docs/origins/WorkMap_제품기획서_v0.4_Jira기반.md`. 설계 산출물 T1-1~T1-8, T2-1, T3-1, T3-2, T3-3, T3-5를 v0.4 기준으로 전면 재작성.
  - **계층**: 단일 Task + task_type 분기 → **work_item 단일 테이블 + issue_type(Epic/Story/Task/Bug/Sub-task) + parent_id/epic_id**. 정공=단일 테이블(Jira `jiraissue`와 동일, 기획서 §14·§15.1-5).
  - **실행 모델**: 칸반 중심 → **Backlog → Sprint → Board**(개발형) / Kanban(운영형). sprint/release 엔티티 신설.
  - **측정 추상화**: 신규, **Phase 1 포함**. measure_unit 마스터 + work_item.target/current. 개발=정성, 운영=정량 한 모델(기획서 §8.5/8.6).
  - **관리자 마스터(하드코딩 금지)**: workflow/workflow_status/workflow_transition, measure_unit, field_scheme, issue_type, project_template (BIZ-107).
  - **모듈 재편**: A.인증 / B.워크스페이스·프로젝트 / C.업무항목(Work Item) / D.애자일실행 / E.운영실행 / F.보기 / G.회사홈·보고 / H.관리자설정 / I.알림 (총 51 기능, MVP 43).
  - **Jira 대비 누락 보완**: 검색·필터·퀵필터(WMP-VIEW-004), 벌크편집·유형전환(WMP-WI-014/015), 프로젝트 가시성·멤버초대(WMP-WS-005/006), 연결된 업무항목(WMP-WI-013).
  - **규칙 변경(★)**: **BIZ-002 담당자 "필수"→"권장(미배정 허용)"**. 근거=기획서 §9.4 "빈칸 강요 금지" + Jira 기본. 미배정은 회사홈에서 강조.
- **변경 사유**: 사용자 제품 방향 전환(2026-06-23). 기존 설계는 v0.3(ClickUp) 기준이라 v0.4 Jira 구조와 불일치.
- **영향 모듈**: 전체
- **영향도**: High
- **영향 범위**: ALL (데이터모델·FSM·기능·화면·Sprint 전면)
- **영향 설계서**: T1-1, T1-2, T1-3, T1-4, T1-5, T1-6, T1-7, T1-8, T2-1, T3-1, T3-2, T3-3, T3-5, execution-spec, CLAUDE.md(추후)
- **재활용(변경 없음)**: 기술 스택(PG16+MyBatis+bp-common-lib, 7700번대, 모노레포, ds-ui), FSM 화이트리스트 방식, 소프트삭제, common_status 비정규화 패턴, 이벤트 인프로세스(ApplicationEvent).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-23) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-23
- **주의**: 목업(frontend/)은 참고/검토용. 구현은 v0.4 설계 기준으로 진행하며 목업과의 diff는 관리하지 않는다.

### CR-007 | Sprint 2 BE 구현 — 인증·사용자·워크스페이스·프로젝트·멤버
- **대상 기능 ID**: WMP-AUTH-001~005, WMP-WS-001~006(가시성/멤버 포함)
- **변경 타입**: 신규 (대규모 — 설계 기반 직진, 캐스케이드 없음: T1~T3 v0.4 확정 설계 그대로 구현)
- **변경 내용**: Sprint 2 백엔드 도메인 5종 신규 구현(`com.therecommerce.workmap.{auth,user,workspace,project,member}`).
  - **Auth**: `POST /api/v1/auth/login`(JWT 발급, AUTH-1) / `refresh`(AUTH-4) / `logout`(stateless) / `GET /auth/me`(AUTH-3). 비밀번호 불일치·비활성 계정 거부(AUTH-2/3, INVALID_CREDENTIALS).
  - **User**: `GET/POST/PATCH /users`, `PATCH /users/{id}/deactivate`. bcrypt 해시 저장(평문 미저장, USR-1), 이메일 UNIQUE(USR-2, EMAIL_DUPLICATED), 비활성화=소프트삭제 is_active=false(USR-3). 생성/수정/비활성화는 Admin/Owner.
  - **Workspace**: `GET/POST/GET{id}/PATCH /workspaces`. 생성/수정 Admin.
  - **Project**: `GET/POST/GET{id} /projects`, `PATCH /{id}/visibility`, `PATCH /{id}/status`, `GET /{id}/summary`. 생성 시 **템플릿 default_tabs→active_tabs / default_workflow_id→workflow_id 복사**(PRJ-1), **status=PLANNING 고정**, **key UNIQUE 검증**(PROJECT_KEY_DUPLICATED), **생성자를 MANAGER 멤버로 자동 등록**(사용자 결정 2026-06-26). 상태 전이는 ProjectStatus 화이트리스트(PLANNING→ARCHIVED 거부 PRJ-4 / ARCHIVED→ACTIVE 허용 PRJ-5). 생성/변경은 Manager 이상.
  - **Member**: `GET/POST/DELETE /projects/{id}/members`. 초대/제거 Manager 이상.
  - **가시성 권한 필터(BIZ-108)**: 목록·상세·요약에서 PRIVATE 프로젝트는 멤버/생성자에게만 노출(`ProjectMapper.findVisible` + `assertVisible`).
- **공통 보정(Sprint 1 노출 결함)**:
  - **SecurityWhitelist 경로 오류 수정**: `/api/auth/login` → `/api/v1/auth/login`(실제 컨트롤러 prefix와 불일치로 로그인 403이던 것 수정).
  - **@PreAuthorize 거부 403 매핑 추가**: `WmpSecurityExceptionHandler`(HIGHEST_PRECEDENCE) — bp-common-lib GlobalExceptionHandler가 AccessDeniedException을 500으로 처리하던 것을 403(CommonErrorCode.FORBIDDEN)으로 가로챔.
  - **JSONB List&lt;String&gt; 매핑**: `StringListJsonTypeHandler` + JDBC URL `stringtype=unspecified`(active_tabs/issue_type_codes 등). MyBatis mapper-locations·type-handlers-package 설정.
  - `WmpSecurityConfig`에 `@EnableMethodSecurity` 추가.
- **영향 모듈**: BE (auth/user/workspace/project/member, common.security/exception/mybatis)
- **영향도**: High (신규 도메인 다수 + 보안 설정 보정)
- **영향 설계서**: 없음(T1~T3 v0.4 확정 설계대로 구현). 구현 중 발견은 CLAUDE.md "주의사항"에 누적.
- **검증**:
  - 단위테스트 14개 PASS(AuthServiceTest AUTH-1~4, UserServiceTest USR-1~3, ProjectServiceTest PRJ-1/key중복/PRJ-4/PRJ-5, UserControllerTest·ProjectControllerTest POST happy+검증).
  - Flyway V1·V2 마이그레이션 성공(issue_type 5/workflow 3/project_template 3/measure_unit 7 시드).
  - 런타임 E2E(로컬 PG): login 200·오답 401·me·users 201/중복 409/검증 400, workspace 201, project 201(템플릿 복사·PLANNING·MANAGER 자동멤버)·key중복 409·PRJ-4 409/PRJ-5 200·visibility PRIVATE, BIZ-108(멤버 노출/비멤버 목록 제외·상세 403), 권한 게이트 403.
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-26, 대규모·생성자 MANAGER 자동등록 결정) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-26

### CR-008 | Sprint 4 BE 구현 — 애자일·운영 실행(스프린트/보드/목록/벌크/OPS/승인)
- **대상 기능 ID**: WMP-AGL-001~005, WMP-OPS-001~003·006, WMP-WI-015(벌크), WMP-VIEW-001·004(통합 목록)
- **변경 타입**: 신규 (대규모 — 설계 기반 직진, 캐스케이드 없음: T1~T3 v0.4 확정 설계 그대로 구현)
- **범위 결정(불일치 해소)**: 승인 게이트(WMP-OPS-006, ApprovalService)는 T1-7 Sprint 4 표에는 미기재였으나 **T3-5 단위테스트 명세가 Sprint 4 섹션(APR-1~8)에 정의**하고 있어, 사용자 결정(2026-06-26, "포함")에 따라 본 Sprint 4에 포함. 향후 T1-7 표에 승인 행 반영 권장.
- **변경 내용**: 신규 모듈 4종 + 기존 work_item 확장.
  - **agile**(`agile.{domain,dto,mapper,service,controller}`): Sprint FSM(FUTURE→ACTIVE→COMPLETED).
    - `GET /api/v1/projects/{id}/backlog`(스프린트 구역들 + 백로그, 헤더 카운트/스토리포인트 합), `GET/POST /projects/{id}/sprints`, `POST /sprints/{id}/start`(SPR-1 동시 ACTIVE 1개 차단·기간 고정·SprintStarted 발행), `POST /sprints/{id}/complete`(SPR-3 미완료 이월=동일 트랜잭션·SprintCompleted 발행). COMPLETED 재개 거부(SPR-4).
  - **board**(`board.{dto,service,controller}`): `GET /projects/{id}/board` — 워크플로 상태(sort_order)별 컬럼+카드(BRD-1). ACTIVE 스프린트 있으면 그 항목, 없으면 프로젝트 전체(운영형 칸반). 상태 변경은 보드가 하지 않고 `/work-items/{id}/status`(FSM 가드) 재사용(BRD-2).
  - **통합 목록**(`WorkItemQueryService`): `GET /work-items` — 필터(유형/상태/우선순위/담당자/스프린트/Epic/키워드)+정렬(화이트리스트 컬럼)+페이징(PageResponse)+**가시성(BIZ-108, findVisible 기반)**(LST-1~4).
  - **벌크 편집**(`WorkItemBulkService` + `WorkItemBulkProcessor`): `PATCH /work-items/bulk` — 항목별 FSM 개별 검증(BLK-1), **실패 항목 분리 보고(전체 롤백 아님, BLK-2)**. 항목 단위 `REQUIRES_NEW` 격리(프록시 경유 위해 별도 빈 분리).
  - **OPS**(`ops.{dto,service,controller}`): `GET /projects/{id}/throughput`(기간 내 완료 담당자별 집계, 미배정 포함, OPS-002), `POST /work-items/{id}/promote-to-backlog`(현장 이슈→개발 프로젝트 신규 항목 생성 + 원본↔신규 RELATES_TO 양방향 링크, OPS-003).
  - **approval**(`approval.{domain,dto,mapper,service,controller}`): 승인 게이트(WMP-OPS-006).
    - `ApprovalGate`(저수준 훅, work_item changeStatus에 통합): 게이트 상태(`is_approval`) 진입 시 PENDING 승인 행 자동 생성 + ApprovalRequested 발행(APR-1/7), 게이트 상태에서 PENDING 잔존 시 다음 전이 차단(APR-2, BIZ-110).
    - `ApprovalService`: `GET /projects/{key}/approvals`·`GET /work-items/{id}/approvals`·`POST /approvals/{id}/decision`. 권한 검증(지정 승인자/역할, APR-3·BIZ-111), APPROVE 시 전원 승인되면 다음 상태 전이(POL-011·APR-4·6), REJECT 시 반려 상태 전이+사유(APR-5), ApprovalDecided 발행(APR-8). 승인 결과 전이는 게이트 PENDING 차단을 우회(bypassApproval).
  - **work_item 통합**: `WorkItemService.changeStatus`에 `ApprovalGate` 훅 결선(게이트 진입/이탈). 순환 의존 회피 위해 게이트를 별도 빈으로 분리, 승인 진행용 `changeStatus(.., bypassApproval)` 오버로드 추가.
  - **공통**: 이벤트 신규 4종(`SprintEvents.SprintStarted/SprintCompleted`, `ApprovalEvents.ApprovalRequested/ApprovalDecided` — T1-6 페이로드 그대로). 에러코드 추가(`SPRINT_NOT_FUTURE` 7732, `SPRINT_NOT_ACTIVE` 7733, `APPROVAL_PENDING` 7752, `APPROVAL_ALREADY_DECIDED` 7753). `WorkItemLinkMapper`(insert, ON CONFLICT DO NOTHING) 최소 구현(전체 링크 API는 Phase 2). `ProjectMemberMapper.findRole` 추가(승인 권한).
- **스키마**: V1에 sprints/releases/approvals/work_item_links 및 workflow_status.is_approval/approver_role가 이미 존재 → **신규 마이그레이션 불요**.
- **영향 모듈**: BE (agile, board, ops, approval 신규 + workitem.{service,mapper,dto,controller}, member.mapper, common.{event,exception})
- **영향도**: High (신규 모듈 다수 + work_item 상태 전이에 승인 게이트 통합)
- **영향 설계서**: 없음(T1~T3 v0.4 설계대로 구현). T1-7 Sprint 4 표에 승인 행 반영은 후속 권장.
- **구현 중 보정(E2E에서 노출된 기존 결함 + Sprint 4 자체 결함)**:
  - **(기존, Sprint 3) MyBatis TypeHandler 자동 스캔 충돌**: `type-handlers-package`가 `common.mybatis`를 스캔하면 `StringListJsonTypeHandler`(@MappedTypes(List))와 `LongListJsonTypeHandler`가 같은 raw `List` 키로 자동등록되어, 나중 등록이 `active_tabs`(List&lt;String&gt;) 조회를 가로채 500("backlog"를 Long 파싱). → 자동 스캔 제거 + `AppConfig.ConfigurationCustomizer`에서 String 핸들러만 `List`에 명시 등록, Long 핸들러는 `common.mybatis.scalar`로 이동 후 CommentMapper.xml 명시 지정으로만 사용.
  - **(기존, Sprint 3) work_items.labels/related_solutions NOT NULL 위반**: `WorkItemService.create`가 요청 누락 시 null을 INSERT → DB default('[]') 무시. → null이면 `List.of()` 기본값.
  - **(Sprint 4 자체) WorkItemQueryService NPE**: `Map.of()`는 null 키 불허라 `getOrDefault(params.sort()=null,..)`이 NPE. → sort null 선방어. (Mapper mock 단위테스트로는 미검출 — 실 호출 경로 결함.)
- **검증**:
  - 단위테스트 신규 25개 PASS — SprintServiceTest(SPR-1~5/C1) 7, ApprovalGateTest(APR-1/2/7) 6, ApprovalServiceTest(APR-3/4/5/6/8) 6, BoardServiceTest(BRD-1) 2, OperationsServiceTest(OPS-002/003) 2, WorkItemBulkServiceTest(BLK-1/2) 2. 기존 포함 전체 `./gradlew test` BUILD SUCCESSFUL.
  - **런타임 E2E(서버 기동·curl, 로컬 PG 5432/workmap) 전 항목 PASS**: 통합목록(필터·정렬·페이징) / 보드(워크플로 상태별 컬럼·카드) / 스프린트 생성·시작(동시 ACTIVE 1개 차단 WMP-7731)·완료(미완료 S2 이월) / 백로그(스프린트 구역+백로그, SP 합) / 벌크(우선순위 일괄 + 부분실패 분리보고) / OPS promote(신규 항목 + 원본↔신규 RELATES_TO 양방향) / 처리량 / **승인 게이트 전 플로우**(APR-1 PENDING 자동생성·APR-2 전이차단 WMP-7752·APR-3 권한거부 WMP-7751·APR-4 승인 후 DONE 전이+completed_at).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-26, 대규모·승인 게이트 포함 결정) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-26

### CR-009 | Sprint 5 BE 구현 — 회사홈/보고·관리자 마스터·알림 수신
- **대상 기능 ID**: WMP-HOME-001~003(회사홈/보고), WMP-ADM-001~003(관리자 마스터: 측정단위/필드스킴/워크플로), WMP-NOTI-001(알림 수신)
- **변경 타입**: 신규 (중규모 — 설계 기반 직진, 캐스케이드 없음: T1~T3 v0.4 확정 설계·V1 스키마 그대로 구현)
- **범위 결정(사용자, 2026-06-26)**:
  - 대시보드(막힘/지연/미배정 목록·지표): **전사 기준(가시성 BIZ-108 필터) + `?projectId=` 옵션**으로 프로젝트 단위 축소.
  - 관리자 마스터 API: **OWNER·ADMIN 전용**(`@PreAuthorize`).
  - P2 항목(보기 timeline/calendar, issue-types/forms 관리, 연결 링크 API 전체)은 본 Sprint 범위 제외.
- **변경 내용**: 신규 모듈 2종(dashboard, admin) + notification 조회 보강 + 마스터 도메인 보강.
  - **dashboard**(`dashboard.{dto,mapper,service,controller}`): `GET /api/v1/dashboard/{blocked,delayed,unassigned}`(가시 프로젝트 필터, `?projectId=` 옵션, 미가시 시 0건), `GET /dashboard/metrics`(진행중/오늘마감/이번주마감/미배정/장기미변경), `GET /projects/{id}/report`(ProjectSummary 진행률·지연·막힘 + 분포 위젯 상태별/유형별/담당자별). 지연=POL-002(`due_date<today` AND 제외 {DONE,HOLD}), 정체=POL-003(`status_changed_at < now - staleDays`, 설정 `workmap.stale.threshold-days` 기본 7). 목록 항목은 `WorkItem` 도메인으로 매핑(DashboardMapper.xml이 `WorkItemMapper.workItemMap` resultMap 재사용) 후 `WorkItemDtos.Response.from` 변환.
  - **admin**(`admin.{domain,dto,mapper,service,controller}`): 단일 `AdminController`(`/api/v1/admin/**`, class-level `@PreAuthorize("hasAnyAuthority('OWNER','ADMIN')")`).
    - **측정단위 CRUD**(WMP-ADM-001, `AdminMeasureService` + 기존 `MeasureUnitMapper` 확장): value_type 화이트리스트(NUMBER/BOOLEAN/SELECT) 검증, `is_system` 수정·삭제 가드(7771), `work_items.measure_unit_id` 사용중 삭제 가드(7772).
    - **필드스킴 CRUD**(WMP-ADM-002, `FieldScheme` 신규 도메인·매퍼): project_id null=전역 기본, issue_type/project별 표시 on/off·필수.
    - 권한 가드: class-level `@PreAuthorize("hasAnyRole('OWNER','ADMIN')")`(런타임 실측 — 0.1.0 JwtFilter가 `ROLE_` 접두 부여, UserController와 동일 컨벤션). *구현 중 hasAuthority로 잘못 작성 → E2E에서 ADMIN 토큰 403으로 검출·수정.*
    - **워크플로 CRUD**(WMP-ADM-003, `Workflow`·`WorkflowTransition` 신규 도메인 + `AdminWorkflowMapper`): workflow + statuses + transitions. FSM 가드용 읽기 매퍼(`WorkflowMapper`)와 분리해 편집은 별도 매퍼. common_status 화이트리스트(CommonStatus enum) 검증, `is_system` 보호(7775), 프로젝트 사용중 워크플로(7776)·업무항목 사용중 상태(7778) 삭제 가드, 전이 from/to 상태 소속 검증(7781)·중복 차단(7780), 상태 삭제 시 연결 전이 정리.
  - **notification 수신**(`notification.{dto,service,controller}` 신규 + `NotificationMapper` 조회 메서드 추가): `GET /api/v1/notifications`(본인·읽음필터·페이징), `GET /notifications/unread-count`, `PATCH /notifications/{id}/read`(본인 가드 7761). 발행(`NotificationEventListener`)은 Sprint 3 기존 — 수신 조회만 추가.
  - **공통**: 에러코드 7760번대 신규 14종(NOTIFICATION_* 7760~7761, MEASURE_UNIT_* 7770~7772, FIELD_SCHEME 7773, WORKFLOW_* 7774~7781). 마스터 도메인(`MeasureUnit`/`WorkflowStatus`)에 `@NoArgsConstructor @AllArgsConstructor` 부여(CR-008 규칙 — MyBatis setter 매핑).
- **스키마**: V1에 measure_unit/field_scheme/workflow/workflow_status/workflow_transition/notifications가 이미 존재 → **신규 마이그레이션 불요**.
- **영향 모듈**: BE (dashboard, admin 신규 + notification.{dto,service,controller,mapper} + measure/workflow 도메인·매퍼 + common.exception)
- **영향도**: Medium (신규 조회/CRUD 모듈, 기존 상태 전이·발행 로직 무변경)
- **영향 설계서**: 없음(T1~T3 v0.4 설계대로 구현).
- **구현 중 보정**:
  - **(기존 결함 노출) @WebMvcTest 슬라이스에 신규 매퍼 @MockBean 누락**: 메인 앱 `@MapperScan("..**.mapper")`이 컨트롤러 슬라이스 컨텍스트에도 적용되어, 신규 매퍼(DashboardMapper/FieldSchemeMapper/AdminWorkflowMapper) 빈이 SqlSessionFactory 없이 생성 시도되어 컨텍스트 로딩 실패(`sqlSessionFactory required`). → User/Project/WorkItem ControllerTest 3개에 신규 매퍼 `@MockBean` 3종 추가. **신규 매퍼 추가 시 기존 @WebMvcTest 슬라이스에도 mock 동반 등록 필요**(누적 주의사항).
- **검증**:
  - 단위테스트 신규 22개 PASS — NotificationServiceTest 4(목록·읽음·본인가드·없음), DashboardServiceTest 6(가시필터·미가시차단·지표제로·보고서 NOT_FOUND/차단/진행률), AdminMeasureServiceTest 6(생성·타입검증·시스템보호·사용중/미사용 삭제·없음), AdminWorkflowServiceTest 6(시스템보호·사용중·공통상태검증·상태추가·전이 소속/중복/정상). 전체 `./gradlew test` BUILD SUCCESSFUL(99/99 PASS).
  - **런타임 E2E(서버 기동·curl)는 미수행** — 사용자 승인 후 진행(코드 수정/빌드/재기동 규칙).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-26, 중규모 결정) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-26

### CR-010 — P2 BE 구현 (링크·타임라인/캘린더·업무유형 마스터·양식 빌더+제출)

- **변경 타입**: 신규 | **영향도**: Medium
- **배경**: Sprint 1~5 BE 완료 후 보류했던 P2 BE 4종(F1 링크 전체 API, I 타임라인/캘린더, K 업무유형 마스터 CRUD, K 양식 빌더 CRUD+제출)을 일괄 구현. 설계(T1~T3 v0.4)에 이미 정의돼 있어 설계 변경 없이 구현만 진행.
- **변경 내용**:
  - **F1 링크(WMP-WI-013, BIZ-109)** — `GET/POST/DELETE /api/v1/work-items/{id}/links`. 신규 `WorkItemLink` 도메인 + `WorkItemLinkService` + `LinkDtos`, 기존 `WorkItemLinkMapper`(.java/.xml) 확장(findById/findBySource 조인/deletePair). **양방향 자동 생성**: 정방향(BLOCKS) + 짝(INVERSE=BLOCKED_BY) 2행 저장, RELATES_TO는 대칭. 삭제도 양방향 1쌍 제거. 가드: 자기참조 금지(7790), 유형 화이트리스트(7792, BLOCKS/BLOCKED_BY/RELATES_TO/DUPLICATES), 양쪽 항목 존재. 활동로그 LINK 양쪽 기록. 엔드포인트는 기존 `WorkItemSubResourceController`에 추가.
  - **I 타임라인/캘린더(WMP-VIEW-002/003)** — 신규 `view` 모듈(`view.{dto,mapper,service,controller}`). `GET /api/v1/projects/{id}/timeline`(start_date 또는 due_date 있는 항목 막대), `GET /projects/{id}/calendar?year=&month=`(기한 기준 월별, 미지정 시 현재 월=Clock). work_item 파생 뷰(BIZ-106) — 별도 테이블 없이 일정 컬럼 조회. **가시성(BIZ-108)은 DashboardService와 동일 정책**(사용자 결정 2026-06-26): 프로젝트 존재 확인 + viewer 가시 목록(`ProjectMapper.findVisible`)에 없으면 NOT_PROJECT_MEMBER 차단. 캘린더는 due_date별 LinkedHashMap 그룹.
  - **K 업무유형 마스터 CRUD(WMP-ADM-004, BIZ-107)** — `GET/POST/PUT/DELETE /api/v1/admin/issue-types`. 신규 `admin.domain.IssueTypeMaster`(workitem `IssueType` enum은 계층판정용으로 분리 유지) + `IssueTypeMapper`(.java/.xml) + `AdminIssueTypeService`. 가드: 시스템 5종(is_system) 수정·삭제 보호(7794), 사용중(work_items.issue_type) 삭제 가드(7795), 코드 UNIQUE(7796), depth 0~2 검증. code는 식별자라 update에서 미변경.
  - **K 양식 빌더 CRUD+제출(WMP-ADM-005)** — `GET/POST/PUT/DELETE /api/v1/admin/forms`, `GET /admin/forms/{id}`, **`POST /admin/forms/{id}/submit`**(사용자 결정 2026-06-26: 제출 포함). 신규 `admin.domain.Form` + `FormMapper`(.java/.xml) + `AdminFormService`. fields는 JSONB 원본 String 패스스루(checklist와 동일, stringtype=unspecified). 제출은 양식 정의(project/issue_type)로 **WorkItemService.create에 위임**(key 채번·시작상태 고정·이벤트 발행 그대로, 제출자=reporter). 제출 엔드포인트만 메서드 레벨 `@PreAuthorize("isAuthenticated()")`로 완화(나머지는 클래스 레벨 OWNER/ADMIN).
  - **공통**: 에러코드 7790번대 신규 9종(LINK_* 7790~7792, ISSUE_TYPE_* 7793~7796, FORM_NOT_FOUND 7797). 기존 `AdminController`에 issue-types/forms 엔드포인트 추가, `AdminDtos`에 IssueType/Form DTO 추가.
- **스키마**: V1에 work_item_links/issue_type/forms가 이미 존재 → **신규 마이그레이션 불요**.
- **영향 모듈**: BE (view 신규 + admin.{domain,dto,mapper,service,controller} 확장 + workitem.{domain,dto,mapper,service,controller} 링크 확장 + common.exception). FE·DB 마이그레이션 무변경.
- **영향 설계서**: 없음(T1~T3 v0.4 설계대로 구현).
- **구현 중 보정**:
  - **(CR-009 누적 규칙 적용) @WebMvcTest 슬라이스에 신규 매퍼/서비스 @MockBean 동반 등록**: 메인 `@MapperScan`이 슬라이스에도 적용 → 신규 매퍼(IssueTypeMapper/FormMapper/ViewMapper)를 User/Project/WorkItem ControllerTest 3곳에 @MockBean 추가. 또 WorkItemSubResourceController가 LinkService 의존 추가 → WorkItemControllerTest에 `WorkItemLinkService` @MockBean 추가(NoSuchBeanDefinitionException 해소).
- **검증**:
  - 단위테스트 신규 4클래스 — WorkItemLinkServiceTest 7(양방향·대칭·자기참조·유형·없는항목·삭제·소유불일치), ViewServiceTest 6(타임라인 성공/미가시차단/없는프로젝트·캘린더 그룹/월검증), AdminIssueTypeServiceTest 6(생성·코드중복·depth·시스템보호·사용중/미사용 삭제), AdminFormServiceTest 5(생성·유형검증·없는양식·제출위임·제출없음). 전체 `./gradlew test` BUILD SUCCESSFUL(122 PASS, 0 fail).
  - **런타임 E2E(서버 기동·curl)는 미수행** — 사용자 승인 후 진행(코드 수정/빌드/재기동 규칙).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-26, 중규모 결정 + 가시성·제출 2개 결정) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-26

### CR-011 — 설계(T3-2) 대비 미구현 BE 3종 마감 (프로젝트 수정·보관 + 받은함)

- **변경 타입**: 신규 | **영향도**: Medium
- **배경**: Phase 1 + P2 BE 완료 후, 설계(T3-2)에 정의돼 있으나 컨트롤러가 비어 있던 마지막 3개 엔드포인트를 마감해 **Phase 1 + P2 BE 100% 완료**. 설계(T1~T3 v0.4)에 이미 정의돼 있어 설계 변경 없이 구현만 진행(T3-2 inbox 행에 받은함 의미 1줄 명확화만 추가).
- **변경 내용**:
  - **PATCH /api/v1/projects/{id} 프로젝트 수정(WMP-WS-004, P2)** — name/description/active_tabs(탭 조합)/start_date/end_date 부분수정(PATCH 의미: null 필드는 미변경). visibility/status는 기존 전용 엔드포인트(`/visibility`·`/status`) 유지 — 섞지 않음. `ProjectMapper.updateProject`(신규 메서드 1개, 신규 매퍼 클래스 아님) + XML `<set>` 동적 부분 UPDATE, active_tabs는 `StringListJsonTypeHandler`(CR-008 규칙). 가드: `@PreAuthorize("hasAnyRole('MANAGER','ADMIN','OWNER')")`(visibility/status와 동일 컨벤션 — 사용자 결정 2026-06-26 방식 A). DTO `ProjectDtos.UpdateRequest` 신규.
  - **PATCH /api/v1/projects/{id}/archive 보관(WMP-WS-004, P2)** — 기존 `ProjectMapper.archive()`(status='ARCHIVED'+archived_at=now, 소프트 보관) 컨트롤러/서비스 연결. **FSM 가드 경유**(BIZ-010): 현재 상태→ARCHIVED가 화이트리스트 허용일 때만(ACTIVE/DONE→ARCHIVED 허용, PLANNING→ARCHIVED 거부 PRJ-4). `ProjectService.archive()` 신규(changeStatus의 ARCHIVED 분기와 동일 가드 재사용). 가드: Manager 역할.
  - **GET /api/v1/inbox 받은함(WMP-NOTI-001, P1)** — **실측 판단**: T1-1 정의상 "내게 온 것 통합"은 이미 `notifications.type`(ASSIGNED/MENTIONED/OVERDUE/BLOCKED/DUE_APPROACHING)으로 통합 수신됨 → 별도 소스 런타임 합산 테이블이 **아님**. 단순 `/notifications` 목록 별칭이되, 받은함 본질(목록+안읽음 배지)을 살려 **items + unreadCount를 한 번에** 반환. 신규 `InboxController` + `InboxService`(기존 `NotificationService.list()`/`unreadCount()` 재사용 — 신규 매퍼 없음) + `InboxDtos.Response{items, unreadCount}`. 인증 사용자 본인 것만.
  - **공통**: 에러코드 신규 없음(기존 7711 TRANSITION_NOT_ALLOWED·7720 PROJECT_NOT_FOUND 재사용). `Project` 도메인에 `@NoArgsConstructor @AllArgsConstructor` 부여(CR-008 규칙 — MyBatis setter 매핑 안전; 기존 `@Builder`만 보유했던 것 보정).
- **스키마**: projects 테이블(active_tabs/archived_at/status)·notifications 모두 기존 → **신규 마이그레이션 불요**.
- **영향 모듈**: BE (project.{dto,service,controller,mapper}+XML, notification 신규 inbox.{dto,service,controller}, project.domain). FE·DB 마이그레이션 무변경.
- **영향 설계서**: T3-2(inbox 행 의미 1줄 명확화). T1~T3 그 외 무변경.
- **구현 중 보정**:
  - 신규 매퍼 클래스 없음(ProjectMapper에 메서드 1개 추가, Inbox는 NotificationMapper 재사용) → CR-009 @WebMvcTest mock 규칙 불해당, 슬라이스 mock 추가 불필요(실측 확인).
  - PATCH 부분수정은 `<set>` 동적 XML + null-skip — null 필드 미변경 확인(E2E: visibility/status 보존).
- **검증**:
  - 단위테스트 신규 8개 PASS — ProjectServiceTest +4(부분수정 갱신·없는프로젝트 NOT_FOUND·ACTIVE 보관 성공·PLANNING 보관 거부), ProjectControllerTest +2(PATCH /{id} 200·PATCH /archive 200), InboxServiceTest 2(목록+배지 통합·빈상태). 전체 `./gradlew test` BUILD SUCCESSFUL(130 PASS, 0 fail).
  - **런타임 E2E(curl, 서버 8186 기동) 완료**: ① GET /inbox → `{notifications:{items,totalCount,...}, unreadCount}` 통합 응답 정상. ② PATCH /projects/1 → name·activeTabs(JSONB)·description 반영, 미전달 visibility/status 보존. ③ PATCH /projects/3/archive(PLANNING) → WMP-7711 거부, PATCH /projects/1/archive(ACTIVE) → ARCHIVED+archived_at, DB 확인. 테스트 후 데이터 원복.
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-26, 중규모 결정 + 권한 방식 A 결정) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-26

### CR-012 — Phase 2 잔여 BE 3종 (번다운/번업·벨로시티 + 현장검증 기록 + 저장 필터)

- **변경 타입**: 신규 | **영향도**: Medium
- **배경**: CR-011로 Phase 1 + P2 BE를 100% 마감한 뒤, Phase 2 Medium 기능 중 BE가 비어 있던 마지막 3종(WMP-AGL-006 번다운/벨로시티, WMP-OPS-004 현장검증 기록, WMP-VIEW-004 저장 필터)을 구현. T1(기능요구사항·FSM·이벤트 계약)은 이미 v0.4에 정의돼 있어 T1 무변경, **T3(데이터 모델·API)만 캐스케이드**. 번다운만 스냅샷 테이블 신규 필요(실측: `field_verifications` V1:281·`saved_filters` V1:323 존재, 번다운 스냅샷 테이블 부재).
- **변경 내용**:
  - **번다운/번업·벨로시티(WMP-AGL-006, P2)** — `burndown_snapshots` 테이블 신규(마이그레이션 V3). `GET /api/v1/sprints/{id}/burndown`(일자별 잔여/누적완료/기준선) + `GET /api/v1/projects/{id}/velocity`(완료 스프린트별 completed_points + 평균). **스냅샷 적재 = 이벤트 + 일별 스케줄러**(사용자 결정 2026-06-26):
    - `SprintStarted` 소비 → START 스냅샷(기준선 total_points 고정, remaining=total, completed=0).
    - 일별 스케줄러(`@Scheduled`) → ACTIVE 스프린트마다 당일 DAILY 스냅샷(remaining=미완료 SP 합, completed=완료 SP 누적). UNIQUE(sprint_id, snapshot_date)로 UPSERT 멱등.
    - `SprintCompleted` 소비 → COMPLETE 스냅샷(완료 시점 최종). 벨로시티 = COMPLETE 스냅샷들의 completed_points 평균.
    - 리스너는 `@TransactionalEventListener(AFTER_COMMIT)` + `@Async`(NotificationEventListener 패턴) — SprintService는 리스너를 모른다(인터페이스 바인딩, T1-6).
  - **현장검증 기록(WMP-OPS-004, P2)** — `GET·POST /api/v1/work-items/{id}/field-verifications`. 검증자/검증일/장소/환경/테스트내용/결과(PASS/FAIL/PARTIAL)/발견이슈를 `field_verifications`에 기록. `createFollowUp=true`면 발견 이슈를 후속 업무 항목으로 생성(원본↔후속 RELATES_TO 양방향 링크 — OperationsService.promoteToBacklog와 동일 패턴, WorkItemService.create 위임). **상태 전이는 기록이 직접 하지 않음** — DEV_DONE→FIELD_VERIFYING→OPS_APPLIED(T1-5 현장검증형)는 별도 `PATCH /status`(FSM 가드)로(BIZ-010 직접 status UPDATE 금지).
  - **저장 필터(WMP-VIEW-004, P2)** — `GET·POST·PUT·DELETE /api/v1/saved-filters`. `saved_filters` CRUD. 목록 = 내 것(owner_id) + 공유된 것(is_shared=true). query(JSONB, `StringList`이 아닌 자유 JSON → `JsonTypeHandler` 또는 Map 핸들러). 수정·삭제는 **소유자만**(owner_id 일치 검증, 불일치 FORBIDDEN). Phase 1 기본/전문/퀵필터(`/work-items`)는 그대로 — 저장/공유 부분만 추가.
- **스키마**: `field_verifications`·`saved_filters` 기존(V1) → 무변경. `burndown_snapshots`만 **신규(V3 마이그레이션)**.
- **영향 모듈**: BE — 신규 모듈 `burndown`(domain/mapper/service/controller/listener/scheduler), `ops`에 현장검증 추가(또는 `verification` 신규), `view`에 saved-filter 추가(또는 `filter` 신규). 에러코드 WMP-7798~ 추가. FE 무변경(별도 FE 작업).
- **영향 설계서**: T3-1(burndown_snapshots 테이블 + ER 관계 추가), T3-2(G 번다운/벨로시티 2행·H 현장검증 2행·I 저장필터 4행 + 각 메모). T1~T2 무변경.
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-26, 중규모 결정 + 스냅샷 적재=이벤트+일별 스케줄러 결정) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-26

### CR-013 — FE Sprint 4 화면 1차: 보드(칸반/스크럼) + 백로그

- **변경 타입**: 신규 | **영향도**: Medium
- **배경**: BE는 Phase1+P2(CR-012 포함)까지 100% 완료·운영 E2E 끝. 남은 작업은 FE 전부. FE를 BE Sprint 분할과 동일하게 Sprint 단위로 진행(StubPage `sprint=` 태그 내장)하기로 한 결정(2026-06-27)에 따라, Sprint 4 화면 중 **보드·백로그** 2종을 먼저 구현. T3-3 §보드(L148)·§백로그(L137)가 이미 v0.4로 확정돼 있어 **설계 캐스케이드 불필요(구현만)**. 사용자 결정(2026-06-27): 중규모·풀 DnD(@dnd-kit)·실 BE 직접 연동.
- **변경 내용(FE)**:
  - **신규 의존성**: `@dnd-kit/core·sortable·utilities`(보드/백로그 드래그앤드롭).
  - **신규 feature `board`**: `api.ts`(GET `/projects/{id}/board`, PATCH `/work-items/{id}/status`) + `hooks.ts`(`useBoard`, `useChangeStatus` — **낙관적 업데이트 + 서버 권위 롤백** T1-5 UI FSM, 순수 reducer `moveCard` 분리) + composite `WorkItemCard`·`DraggableCard`·`KanbanColumn`·`KanbanBoard`·`BlockReasonDialog`.
  - **신규 feature `agile`**: `api.ts`(GET `/projects/{id}/backlog`·`/sprints`, POST `/sprints`·`/sprints/{id}/start`·`/complete`, PATCH `/work-items/{id}/sprint`) + `hooks.ts`(`useBacklog`·`useCreateSprint`·`useStartSprint`·`useCompleteSprint`·`useChangeItemSprint` — 낙관적+롤백, 순수 reducer `moveItem` + 카운트 재계산) + composite `BacklogRow`·`SprintHeader`·`SprintSection`·`CreateSprintDialog`.
  - **화면 구현**: `pages/project/BoardView.tsx`(StubPage→실구현, 드래그로 상태 전이, **BLOCKED 드롭 시 차단 사유 모달 먼저** BIZ-005, 스켈레톤·EmptyState·에러 처리), `pages/project/BacklogView.tsx`(다중 스프린트 + 백로그 공존, 드래그로 스프린트↔백로그 이동, 스프린트 만들기/시작/완료, 앞 스프린트 ACTIVE면 시작 비활성).
  - **공통 보강**: `types/domain.ts`에 `WorkItemResponse`(BE 실 계약)·`Sprint`·`isWorkItemDelayed` 추가, `components/common/skeletons.tsx`에 `BoardSkeleton`·`BacklogSkeleton`, `features/members/use-assignee-name.ts`(assigneeId→이름 해소).
  - **UI 규칙 준수(CLAUDE.md)**: ds-ui만 사용(네이티브 위젯 0 — 날짜는 `DatePicker`+RHF Controller, 확인은 `ConfirmDialog`/`Dialog`, 사유 입력은 `Textarea`), 색 절제(상태/우선순위/막힘 신호에만), 버튼 variant 고정(생성=primary·완료=secondary·취소=ghost), 로딩=스켈레톤, 공통 컴포넌트 재사용.
- **스키마/BE**: 무변경(기존 BE 계약 그대로 소비).
- **검증**: `tsc -b` PASS, `pnpm build`(tsc+vite) PASS, vitest 26/26 PASS(신규 reducer 단위테스트 11개 — `moveCard` 6·`moveItem` 5 포함). **실 BE E2E(8186 bootRun, 로컬 PG 5432) 완료**: 보드/백로그 응답 형태 일치, 작업항목 생성→상태 PATCH(TODO→IN_PROGRESS) 반영, 스프린트 생성(FUTURE)→항목 담기(storyPointsSum 계산)→시작(ACTIVE, board.sprintId 스코프 전환)→완료(carriedOverCount=1 백로그 이월) 전 흐름 확인, 테스트 데이터 원복.
- **영향 설계서**: 없음(T3-3 기존 §보드·§백로그 그대로 구현, 캐스케이드 불필요).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-27, 중규모·풀 DnD·실 BE 결정) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-27

### CR-014 — FE 업무 상세(§9.3) 1차: 보드/백로그 카드 클릭 도착지

- **변경 타입**: 신규 | **영향도**: Medium
- **배경**: 보드(CR-013)·백로그 카드 클릭 시 `ROUTES.workItem(key)`로 이동하나 도착지 `WorkItemDetail`이 StubPage였음. T3-3 §9.3(업무 상세 — 핵심)이 이미 v0.4로 확정돼 있어 **설계 캐스케이드 불필요(구현만)**. BE는 Phase1+P2 100% 완료라 신규 BE 없음. 사용자 결정(2026-06-27): 중규모·핵심 섹션 전부(P2 'Git 연동'·'자동화' 패널 제외).
- **변경 내용(FE)**:
  - **신규 feature `workitem`**: `api.ts`(GET `/work-items/{id}`·`?keyword=`(key→id 해소)·`/comments`·`/links`·`/activities`·`/approvals`, POST `/comments`·`/subtasks`·`/links`, DELETE `/links/{linkId}`, PATCH `/work-items/{id}`·`/status`·`/assignee`·`/measure`·`/sprint`, POST `/approvals/{id}/decision`) + `hooks.ts`(`useWorkItemByKey`(keyword 해소→상세), `useUpdateWorkItem`·`useChangeStatus`·`useChangeAssignee`·`useUpdateMeasure`·`useComments`·`useCreateComment`·`useLinks`·`useCreateLink`·`useDeleteLink`·`useActivities`·`useApprovals`·`useDecideApproval`·`useCreateSubtask`).
  - **신규 composite(features/workitem/components)**: `DetailHeader`(key·이전/다음 화살표·워치·공유·+액션 메뉴·구성·제목 인라인 편집), `DetailBody`(유형별 분기 — Epic 집계·Story 인수조건·Task 체크리스트·공수·Bug 재현절차/기대vs실제/환경/심각도·Sub-task 부모링크), `SubtaskList`, `LinkedItems`(blocks/blocked by/relates to/duplicates), `CommentThread`(@멘션), `ActivityFeed`, `ApprovalBanner`(승인/거부+코멘트, POST decision), `DetailSidePanel`(▾세부 사항 접이식 — 담당자·레이블·상위·기한·시작일·Sprint·SP·보고자·측정).
  - **화면 구현**: `pages/WorkItemDetail.tsx`(StubPage→실구현). 분할뷰/모달/딥링크 무관 동일 구조(§9.3).
  - **공통 보강**: `types/domain.ts` `WorkItemResponse`에 유형별 필드(acceptanceCriteria/stepsToReproduce/expectedResult/actualResult/environment/severity/checklist/relatedSolutions) + Comment/Link/Activity/Approval 타입 추가, `skeletons.tsx`에 `WorkItemDetailSkeleton`.
  - **UI 규칙 준수(CLAUDE.md)**: ds-ui만(네이티브 위젯 0 — 접이식=Accordion, 선택=Select, 날짜=DatePicker, 확인=ConfirmDialog), 색 절제(상태/유형/우선순위/막힘 신호만), 버튼 variant 고정(저장=primary·취소=ghost·삭제 링크=destructive·승인=primary/거부=destructive), 로딩=스켈레톤, 공통 컴포넌트 재사용.
- **스키마/BE**: 무변경(기존 BE 계약 그대로 소비). key→id는 `?keyword=` 검색으로 정확 매칭 해소(BE 별도 by-key 엔드포인트 없음).
- **검증**: `tsc -b` PASS, `pnpm build` PASS, vitest PASS(신규 hook/해소 단위테스트 포함).
- **영향 설계서**: 없음(T3-3 기존 §9.3 그대로 구현, 캐스케이드 불필요).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-27, 중규모·핵심 섹션 전부) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-27

### CR-015 — FE 목록 뷰(§9.5): 통합 목록(표) ⇄ 분할뷰

- **변경 타입**: 신규 | **영향도**: Medium
- **배경**: Sprint4 잔여 화면. `/projects/:key/list`가 StubPage였음. T3-3 §9.5(목록 뷰 — 표/분할 토글)·§9.3(분할 우측 상세) 이미 v0.4 확정 → **설계 캐스케이드 불필요(구현만)**. BE 통합목록 검색·벌크편집 계약 이미 운영 배포(CR-008). 사용자 결정(2026-06-27): 중규모·BE 무변경. 분할뷰 우측은 CR-014에서 만든 §9.3 상세 컴포넌트 재사용.
- **변경 내용(FE)**:
  - **workitem feature 확장**: `list-api.ts`(GET `/work-items` 통합목록 검색 — projectId·issueType·commonStatus·priority·assigneeId·sprintId·keyword·sort(createdAt/dueDate/priority/statusChangedAt/updatedAt)·direction·page·size, PATCH `/work-items/bulk` 벌크편집) + `list-hooks.ts`(`useWorkItems` 페이징 검색(placeholderData 유지), `useBulkUpdate` — 성공 시 목록 invalidate·실패 분리 토스트).
  - **신규 composite(features/workitem/components)**: `WorkItemTable`(ds-ui Table — 선택 체크박스·유형/key/제목/상태/담당자/우선순위/기한 컬럼, 정렬 헤더, 행 클릭) · `WorkListFilterBar`(QuickFilterBar — 유형·상태·우선순위·담당자 Select + SearchInput) · `BulkEditBar`(선택 N건 → 상태/담당자/스프린트/우선순위 일괄, 실패 분리 보고) · `SplitView`(좌 리스트 + 우 §9.3 상세 패널, 리스트 클릭 시 우측 즉시 갱신, 페이지 이동 없음).
  - **화면 구현**: `pages/project/ListView.tsx`(StubPage→실구현, 우상단 표⇄분할 모드 토글, 페이징·정렬·퀵필터·벌크편집·스켈레톤·EmptyState).
  - **공통 보강**: `skeletons.tsx` `WorkListTableSkeleton`(표 헤더+행), 분할 우측은 기존 `WorkItemDetailSkeleton` 재사용.
  - **UI 규칙 준수(CLAUDE.md)**: ds-ui Table/Pagination/Select/Checkbox만(네이티브 위젯 0), 색 절제(상태/우선순위 신호만), 버튼 variant 고정(벌크 적용=primary·취소=ghost), 로딩=스켈레톤, 공통 컴포넌트 재사용.
- **스키마/BE**: 무변경(기존 통합목록·벌크 계약 그대로 소비).
- **검증**: `tsc -b` PASS, `pnpm build` PASS, vitest PASS(신규 hook/필터 단위테스트 포함). 운영 적용은 `./deploy.sh fe`.
- **영향 설계서**: 없음(T3-3 §9.5 그대로 구현).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-27, 중규모·BE 무변경) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-27

### CR-016 — FE 승인 탭(§9.5) + ApprovalBanner decision 판정 버그 수정

- **변경 타입**: 신규 + 설계보정 | **영향도**: Medium
- **배경**: Sprint4 마지막 잔여 화면. `/projects/:key/approvals`가 StubPage였음. T3-3 §9.5(승인) 이미 v0.4 확정 → 캐스케이드 불필요. BE `ApprovalController` 계약 운영 배포됨. **구현 중 BE 실측으로 CR-014 버그 발견**: `approvals.decision`은 `NOT NULL DEFAULT 'PENDING'`(V1 스키마 L302)인데 ApprovalBanner가 `!a.decision`(null=PENDING)으로 판정 → 운영에서 PENDING 승인이 배너에 안 잡힘. 같은 세션 동일 주제 실측 원칙에 따라 함께 수정.
- **변경 내용(FE)**:
  - **버그 수정**: `types/domain.ts` `Approval.decision`을 `ApprovalState('PENDING'|'APPROVED'|'REJECTED')` 非옵셔널로 정정(주석 'null=PENDING' 오류 제거) + `ApprovalBanner` 필터를 `a.decision === 'PENDING'`로 수정.
  - **신규 feature `approval`**: `api.ts`(GET `/projects/{id}/approvals?decision=`, POST `/approvals/{id}/decision`) + `hooks.ts`(`useProjectApprovals` 토글별 필터, `useDecideProjectApproval` 성공 시 목록·보드·상세 invalidate).
  - **화면 구현**: `pages/project/ApprovalsView.tsx`(StubPage→실구현). 토글(승인 대기/내가 요청/모든 승인 — 내가 요청은 클라 requestedBy 필터), 표(유형·업무항목·상태·담당자·승인자·결정·작업), 지정 승인자만 승인/거부(거부는 사유 Dialog), 행 클릭→상세, 빈 상태에서 워크플로 편집기(승인 설정) 링크. 업무 메타(제목/상태/담당자)는 Approval 응답에 없어 `useProjectItems`로 workItemId 해소.
  - **UI 규칙 준수(CLAUDE.md)**: ds-ui Table/Dialog/Button/Textarea만(네이티브 0), 색 절제(결정 배지=신호색만), 버튼 variant 고정(승인=primary·거부=destructive·취소/설정=ghost), 로딩=스켈레톤(WorkListTableSkeleton 재사용).
- **스키마/BE**: 무변경(기존 승인 계약 소비).
- **검증**: `tsc -b` PASS, `pnpm build` PASS, vitest 35/35 PASS. 운영 적용=`./deploy.sh fe`.
- **영향 설계서**: 없음(T3-3 §9.5 그대로 구현). decision 판정은 설계가 아니라 구현 버그 정정.
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-27, 순서대로 진행) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-27

> **참고(2026-06-27 결정)**: CR-013~016(및 이후 FE Sprint 화면)은 **이미 v0.4에 계획·설계 확정된 Sprint를 그대로 구현하는 실행 단계**다. CR(Change Request)은 계획에 없던 변경을 추적하는 체계이므로, 계획된 Sprint 구현에는 CR 번호를 부여하지 않는다(진척은 git 커밋 + CLAUDE.md "현재 진행 상태"로 기록). CR-013~016은 이 결정 전에 부여된 것이며 소급 삭제하지 않고 둔다. 차기 CR 번호는 **설계 개정·계획 외 변경이 실제로 발생할 때** CR-017부터 부여한다.

### CR-017 — 검색 keyword 범위 확장(설명·댓글) — §13.9 충족 BE 보정

- **변경 타입**: 설계보정 | **영향도**: Low
- **배경**: Sprint 5 검색 화면(`/search`) 구현 중 실측 발견. T3-3 §13.9는 "**제목·설명·댓글** 전체 텍스트 검색"을 명시하나, BE 통합목록 `GET /work-items`의 keyword 절이 **제목·key만** ILIKE 검색([WorkItemMapper.xml searchWhere])했다. 계획된 화면이 요구하는 검색 범위를 BE가 미달 → **계획 외 BE 보정**이라 CR 부여(위 원칙: 설계와 어긋난 보정에만 CR). 사용자 결정(2026-06-27): 설명·댓글까지 풀 구현·소규모.
  - **실측 정정**: 전사 검색(projectId 미지정)은 BE가 **이미 지원**한다(`SearchParams.projectId`는 `@NotNull` 아님 — `@NotNull`은 별개 record `CreateRequest`. mapper `searchWhere`는 projectId null이면 `visibleProjectIds`(BIZ-108) 전체 검색). 따라서 전사 검색엔 BE 변경 불필요.
- **변경 내용(BE)**:
  - `WorkItemMapper.xml` `searchWhere`의 keyword 절을 `title·key·**description** ILIKE + comments(content) **EXISTS** 서브쿼리`로 확장. `search`/`countSearch`가 `searchWhere`를 공유하므로 한 곳 수정으로 목록·카운트 동시 반영. DTO·service·스키마 **무변경**.
- **변경 내용(FE — 계획된 Sprint 5 검색 화면, CR 대상 아님이나 같은 커밋)**:
  - 신규 feature `search`: `api.ts`(projectId optional SearchParams + `toQuery`), `hooks.ts`(`useSearch`, placeholderData 유지).
  - `pages/SearchPage.tsx`(StubPage→실구현): 검색 바 + 유형/상태/우선순위 Select + 퀵필터(내 항목/최근 업데이트/막힌 것/미배정) + 결과 표(WorkItemTable 읽기전용 재사용, 전사 담당자 이름은 `GET /users` 전체 맵으로 해소) + 페이징. 회사 홈 카드 도착지(`?quick=blocked|unassigned` 진입 시 퀵필터 선점).
  - 회사 홈 `DashboardListPanel`에 `quickHref` 추가 → 막힘/미배정 패널 "모두 보기"가 `/search?quick=`로 이동(§9.2 카드→검색 연결, 이전 미연결분 마감).
  - MSW: `GET /work-items`(검색) 핸들러 추가(dashItems 기반 keyword·필터·페이징).
- **단위테스트 한계**: keyword mapper SQL은 Testcontainers/실DB 테스트 인프라 부재로 단위검증 불가(기존 전략 — Mapper 테스트는 복잡쿼리만·실DB 없음). FE 계약은 MSW로 5건 PASS.
- **검증**: FE `tsc --noEmit` PASS, `pnpm build` PASS, vitest 50/50 PASS(신규 search 계약 5). BE `./gradlew test` 148 PASS·`bootJar` PASS. 라우트(`/search`)·헤더 검색버튼·회사홈 연결 확인.
- **운영 배포·E2E 완료(2026-06-27, `./deploy.sh all`)**: BE jar 재빌드+docker 재기동, FE 정적 배포. health UP. **mapper keyword SQL을 운영 DB(workmap@59.8.160.12)에 직접 검증**(트랜잭션 INSERT→검색→ROLLBACK, 운영 데이터 무변경): 설명에만 있는 키워드→해당 work_item 매칭 ✅, 댓글(comments.content)에만 있는 키워드→EXISTS로 매칭 ✅, 무관 키워드→0건(거짓매칭 없음) ✅. 검색 API 라우팅·시큐리티 가드 응답 확인(미인증 403). (운영 work_items 0건 상태라 API E2E 대신 SQL 직접검증으로 수행 — 쿼리 정합성 확인이 목적.)
- **영향 설계서**: 없음(T3-3 §13.9 그대로 충족 — 설계는 원래 제목·설명·댓글을 명시했고 BE가 따라온 것).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-27, 설명·댓글 풀 구현·소규모) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-27

### CR-018 — WS 격리 경계 + 진입감 IA (워크스페이스를 슬랙식 멤버십 격리 경계로 전환)

- **변경 타입**: 변경(Phase1 설계 전환) | **영향도**: High(아키텍처/다수 모듈)
- **상태**: **설계 캐스케이드 완료, 구현 미착수**(2026-06-27). 본 CR은 T1~T3+execution-spec 설계 개정분만 포함. BE/FE 구현은 별도 진행 예정.
- **배경**: E2E UX 피드백 #16(진입감/네비게이션 IA) 논의. 현 설계는 워크스페이스를 1급 개념 없이 `/projects` 목록의 **필터**로만 두어(WS 1급화면·`:wsId` 라우트·WS멤버십 부재), 프로젝트·워크스페이스 양쪽 모두 "진입했다"는 컨텍스트가 약했다. 사용자와 다회 토론 끝에 **WS = "사람을 모은 격리된 작업공간"(슬랙 워크스페이스 모델, WS=워크스페이스/프로젝트=채널)**으로 정의 확정. 부서·조직 단위 아님(사용자 명시). WS는 **멤버십 격리 경계** — 속한 사람만 그 안(프로젝트·홈·검색·받은함)을 본다.
- **핵심 결정(사용자)**:
  - 가시성 **2단**: 1차=WS 멤버십(BIZ-112), 2차=프로젝트 PUBLIC/PRIVATE(BIZ-108). 권한은 **전사 Admin만**(WS별 Admin 없음 → `workspace_members`에 role 컬럼 없음).
  - LNB = **ⓐ 확정**: WS 스위처(맨 위 고정) + 그 WS 프로젝트 상시 나열·활성 하이라이트. 프로젝트 진입 후 LNB 유지·**본문 상단 가로탭 유지**(현행 ProjectLayout 불변). LNB 전환식(ⓑ 프로젝트 진입 시 LNB가 프로젝트 탭으로 전환 / ⓒ 펼침)은 "써보고 결정" **보류** — 근거: 사용자가 "WS는 잘 안 바꾸고 프로젝트는 자주 오간다" → 프로젝트 목록 상시 노출이 전환에 유리.
  - 설정(admin 마스터 6종) = **전역**(WS별로 안 쪼갬). 워크플로/업무유형은 조직 표준(BIZ-107/010).
  - FE 진입: 로그인 → 선택 WS 없으면 `/select-workspace`, 있으면 자동 진입. 선택은 localStorage 기억, **진입 시 서버가 멤버십 재검증**.
- **변경 내용(설계 문서)**:
  - **T1-1**: WMP-WS-001 제약 개정("Phase1 소수 전제" 삭제→격리 경계 명시) + 신규 **WMP-WS-007(WS 멤버 초대/관리)**·**WMP-WS-008(WS 선택/전환)**.
  - **T1-3**: BIZ-108 가시성 **2단 경계로 개정** + 신규 **BIZ-112(WS 멤버십 격리 — 전 목록/검색/대시보드/받은함 스코프, 서버 강제)**. (주의: BIZ-110은 기존 승인게이트 규칙이라 112로 신설.)
  - **T1-4**: POL-004에 WS 멤버십 권한·2단 가시성·전사Admin 단일 권한 보강.
  - **T3-1**: `workspace_members` 테이블 신설(workspace_id+user_id PK, role 없음) + **Flyway V4**(+백필: 기존 project_members→workspace 멤버 승격, 격리 차단 방지).
  - **T3-2**: `GET·POST·DELETE /workspaces/{id}/members` + `GET /workspaces`를 "내 WS만"으로 + 전 목록 API **WS 격리 가드(BIZ-112)** 명시 + 에러코드 **WMP-7803~7805**(7800~02는 CR-012 선점, 구현 중 실측 정정).
  - **T3-3**: §9.1 LNB IA 개정(WS 스위처+프로젝트 나열 ⓐ) + 신규 라우트 `/select-workspace`(WMP-WS-008)·`/workspaces/:wsId/members`(WMP-WS-007). 홈/검색/프로젝트목록 WS 스코프 표기.
  - **execution-spec**: §5에 "CR-018 — WS 격리 경계 + 진입감 IA(횡단)" 가이드 추가(BE 본체: V4+백필·WS멤버 도메인·격리 가드·에러코드 / FE: 선택화면·LNB 스위처·컨텍스트 스코프 / 함정: 백필 누락·클라wsId 신뢰 금지·전사집계 멤버WS범위).
- **구현 시 핵심 함정(execution-spec에 상세)**: ① V4 백필 누락 시 기존 운영 사용자 전원 격리 차단(배포 전 필수) ② 격리 가드를 클라 wsId만 믿으면 무력화 — 서버 멤버십 교집합 강제 ③ 회사홈 전사집계도 멤버 WS 범위(전 WS 무차별 금지).
- **영향 설계서**: T1-1·T1-3·T1-4·T3-1·T3-2·T3-3·execution-spec(7종).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-27, 슬랙식 WS 격리·2단 가시성·전사Admin·LNB ⓐ·설계 캐스케이드부터) | **적용 버전**: v2.1
- **변경 일자**: 2026-06-27

### CR-019 — 디폴트 템플릿 + 범용 워크플로 + 탭 `[+]` 추가 + 탭 정합 보정

- **변경 타입**: 신규 + 설계보정 | **영향도**: Medium(단일 모듈 — 프로젝트/워크플로 시드·FE 탭)
- **상태**: 설계 캐스케이드 + 구현(2026-06-28).
- **배경**: E2E UX 피드백 #13/#14(프로젝트 만들기 템플릿·탭) 논의. Jira "빈 스페이스"(8탭 다 켠 기본 템플릿)·"`[+]`로 탭 추가" 구조 대조. 사용자 결정으로 (1) 디폴트 템플릿 1종 추가(8탭 전부), (2) 그 워크플로는 범용 3단계 신규(개발형 재사용 아님), (3) 헤더 가로탭 `[+]` 빠른 추가 구현, (4) BE 시드 default_tabs ↔ FE 상수 탭 불일치(유령 `issues`·누락 summary/reports) 정합. 범주(템플릿 그룹)층은 이번 제외(템플릿 4개라 평면 충분, 추후). 새 탭(문서·목표·릴리스)도 제외(항목별 개발 필요).
- **핵심 결정(사용자)**:
  - 디폴트 템플릿(DEFAULT/"기본형") = **탭 8개 전부 켜고 생성**, 불필요 탭은 생성 후 헤더 `[+]`/설정에서 끔(Jira 빈 스페이스 방식). 마법사에서 일일이 고르게 안 함.
  - 디폴트 워크플로 = **범용형(BASIC) 신규**(할 일→진행 중→완료, 되돌리기/재개 역전이) — 개발형 재사용 아님.
  - 업무유형 = 디폴트는 5종 전부(EPIC·STORY·TASK·BUG·SUBTASK).
  - 범주(category)층·새 탭 개발은 추후(이번 범위 밖).
- **변경 내용**:
  - **T1-5**: §4 범용 워크플로(BASIC) 추가(상태 3종·전이·공통상태군 매핑) + 워크플로 3종→4종 명시.
  - **T3-1**: Flyway **V5** 섹션 추가(범용 워크플로 시드 + DEFAULT 템플릿 시드 + #14 정합 보정 UPDATE) + 템플릿/워크플로 시드 설명 4행/4종으로 갱신.
  - **T3-3**: §9.1 탭 노출 규칙 — 실존 8탭 기준으로 프리셋 정정(릴리스/문서/양식/목표 제거), DEFAULT 프리셋 추가, `[+]` 헤더 빠른추가를 P2 구현으로 명시.
  - **BE 구현**: `V5__basic_workflow_default_template.sql`(범용 워크플로+상태+전이, DEFAULT 템플릿, 기존 3템플릿 default_tabs 정합 UPDATE).
  - **FE 구현**: `PROJECT_TEMPLATES`/`PROJECT_TAB_PRESET`에 DEFAULT 추가 + ProjectType에 'DEFAULT' + project-tabs.tsx 헤더 `[+]` 빠른추가(미노출 탭 메뉴→activeTabs PATCH).
- **#14 정합의 정본**: BE 시드 default_tabs가 정본. FE 상수를 BE에 맞춤(둘 다 route-paths 실존 8탭만). 유령 `issues` 제거.
- **영향 설계서**: T1-5·T3-1·T3-3(3종).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-28, 디폴트=8탭전부·범용워크플로 B안·`[+]`추가·범주층 제외·일사천리 구현) | **적용 버전**: v2.1
- **변경 일자**: 2026-06-28

### CR-020 — 탭 메뉴(Jira식): 라벨 DB화 + 프로젝트별 이름 + 기본탭 + 이동/제거

- **변경 타입**: 신규 | **영향도**: Medium(단일 모듈 — 프로젝트 탭)
- **상태**: 설계 캐스케이드 + 구현(2026-06-28).
- **배경**: CR-019로 헤더 `[+]` 탭 추가를 넣은 뒤, 사용자가 "추가했으면 제거도 있어야" 지적 → Jira 탭 호버 `…` 메뉴(기본값으로 설정 / 이름 바꾸기 / 좌·우 이동 / 제거) 동일 구현 요구. 토론 중 "탭 라벨이 코드 상수(PROJECT_TAB_LABEL)라 프로젝트별 변경 불가"가 드러남(한글이 active_tabs에 박힌 게 아니라 표시용 상수가 전역 1벌인 구조). 프로젝트별 이름이 필요하다는 결정.
- **핵심 설계 결정(사용자 합의)**:
  - **active_tabs(코드 배열)는 구조 무변경.** 객체배열로 갈아엎지 않는다(노가다 대비 실익 낮음). 대신 책임 분리: 켰나(active_tabs) / 부르나(라벨 테이블) / 기본탭(default_tab).
  - **라벨 DB화**: 코드 상수 `PROJECT_TAB_LABEL`을 `tab_def` 테이블로 이관(전역 기본). "코드에 한글 박힘" 해소.
  - **프로젝트별 이름 = `project_tab_label` (sparse 오버라이드)**: 기본값과 다른 것만 저장. 행 없으면 자동 폴백, 되돌리기=DELETE.
  - **폴백 체인**: project_tab_label → tab_def → code.
  - summary는 제거·이동·기본해제 불가(서버 가드).
- **변경 내용**:
  - **T3-1**: Flyway V6 — `tab_def`(8행 시드)·`project_tab_label`(PK project_id+tab_code)·`projects.default_tab` 컬럼. active_tabs 무변경 명시.
  - **T3-2**: `GET /projects/{id}/tabs`(폴백 적용 표시명)·`PUT·DELETE /projects/{id}/tabs/{code}/label`(이름 바꾸기/되돌리기) + 이동·제거·기본탭은 기존 `PATCH /projects/{id}`에 activeTabs/defaultTab. 에러코드 WMP-7806~7808.
  - **T3-3**: §9.1 탭 호버 `…` 메뉴 Jira 동일 구성·동작 매핑 + 라벨은 `GET /tabs` 표시명 사용(상수 의존 제거).
  - **BE 구현**: V6 마이그레이션 + tab_def/project_tab_label 도메인·매퍼·서비스 + ProjectTabController(GET tabs, PUT/DELETE label) + projects.default_tab DTO/매퍼 반영 + 에러코드 3종.
  - **FE 구현**: project-tabs.tsx 탭 호버 `…` 메뉴(이동/제거/기본값/이름바꾸기) + GET /tabs로 라벨 조회(상수 폴백) + 이름바꾸기 다이얼로그.
- **무변경**: active_tabs 컬럼/TypeHandler/매퍼 INSERT·UPDATE, 기존 프로젝트 데이터(테이블 비어도 정상).
- **영향 설계서**: T3-1·T3-2·T3-3(3종).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-28, Jira 탭 메뉴 5개 전부·프로젝트별 이름·active_tabs 무변경+별도 라벨 테이블·일사천리) | **적용 버전**: v2.1
- **변경 일자**: 2026-06-28

### CR-021 — 캘린더 인라인 생성·칩 드래그(Jira식) + 타임라인 월/주 토글

- **변경 타입**: 신규 | **영향도**: Medium(보기 모듈 — 캘린더/타임라인, FE 한정)
- **상태**: 설계 캐스케이드(2026-06-28). 구현 대기.
- **배경**: 사용자가 캘린더 화면을 보고 "달력에 내용을 어떻게 집어넣나" 질문 → 현재 캘린더는 work_item의 due_date를 비추는 읽기 전용 파생 뷰라 직접 입력 수단이 없음(실측: CalendarGrid 칸에 클릭 핸들러 없음). "Jira처럼 추가 가능하게" 요구. 더불어 타임라인이 월 눈금 단일 뷰라 Jira의 월/주 2단위 전환이 없음을 확인하고 함께 검토 요청.
- **핵심 설계 결정(사용자 합의)**:
  - **캘린더 항목 = work_item 파생 뷰 유지(BIZ-106).** 별도 일정/이벤트 테이블 신설하지 않음(사용자: "업무와 동일"). 따라서 "캘린더에 추가" = 마감일 있는 work_item 생성.
  - **빈 칸 클릭 → 그 날짜가 due_date로 프리필된 업무 생성 모달**(현재 프로젝트 + 클릭 날짜). 생성 모달에 due_date 입력 필드(ds-ui DatePicker) 신설.
  - **칩 드래그&드롭 → due_date 변경**(`PATCH /work-items/{id}` 재사용, 낙관적 업데이트 + 실패 롤백).
  - **타임라인 월/주 토글**(ds-ui Button group). 눈금 라벨/간격에만 영향, 표시구간·막대 계산·BE 데이터 동일. 화면 로컬 state(URL·BE 무관).
- **변경 내용**:
  - **T3-3**: 타임라인 §에 시간 단위 토글(월/주) 명세 추가. 캘린더 §에 빈 칸 클릭 인라인 생성·칩 드래그 마감일 변경 명세 추가(조회 API와 생성/이동 API 분리 표기).
  - **FE 구현(예정)**: ① create-modal에 due_date DatePicker 필드 + ui-store에 prefill(projectId·dueDate) 슬롯·openCreateModalWith(prefill) ② CalendarGrid 빈칸 클릭→prefill 오픈, 칩 HTML5 DnD→useUpdateWorkItem({dueDate}) 낙관적 갱신 ③ timeline-util 주 눈금 생성 + TimelineChart 월/주 토글.
- **BE 무변경**: 생성 `POST /work-items`·부분수정 `PATCH /work-items/{id}`(due_date 반영 실측: WorkItemMapper.xml) 재사용. 신규 엔드포인트·테이블·에러코드 없음.
- **영향 설계서**: T3-3(1종).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-28, 생성+칩 드래그 이동·업무와 동일 데이터·타임라인 월/주 토글) | **적용 버전**: v2.1
- **변경 일자**: 2026-06-28

### CR-022 — 백로그 Epic 표시 = 평면 + 소속 칩 + 필터 + 인라인 생성 (펼침 트리 폐기)

- **변경 타입**: 설계보정 + 신규(FE) | **영향도**: Low(백로그 화면 — FE 한정, 신규 BE 0)
- **상태**: 설계 정정 + FE 구현 완료(2026-06-28).
- **배경**: E2E_UX피드백 #18 "백로그 Epic 트리/인라인 생성" 착수 중, 사용자가 "Epic을 하이라키 트리로 둘 필요가 있나"를 의심 → **원전·Jira·우리 코드를 교차 검증**한 결과 구 설계 T3-3 §6.1 "Epic 펼침 트리"가 어긋남을 확인.
  - **애자일 원전 검증(deep-research, 3-vote 확정)**: Mike Cohn *User Stories Applied*(2004) + 본인 블로그 — "an epic is a large user story", "there's no magic threshold". **Epic은 처음부터 만드는 대분류가 아니라 "커져서 쪼갠 큰 story의 묶음"**이며, Theme과 Epic은 크기로 서열화되지 않는 **느슨한 그룹핑**(엄격 계층 아님).
  - **우리 코드 실측**: work_items.epic_id = FK 없는 nullable(느슨 그룹핑), Sub-task만 parentId 강제 계층(validateHierarchy는 SUBTASK만 진입), FE 백로그는 이미 평면 리스트. 즉 구현은 이미 "Epic=그룹핑, 평면". 구 설계 "펼침 트리"만 어긋남.
  - **Jira 실측(사용자 캡처)**: Jira 백로그도 항목을 평면으로 나열 + 행마다 Epic 소속 칩 + 상단 Epic 필터 + 구역별 `+ 만들기`. 트리 들여쓰기 아님.
- **핵심 설계 결정(사용자: "지라 방식대로")**:
  - **Epic 펼침 트리 폐기.** Epic은 들여쓰기 트리로 그리지 않는다(원전·Jira·우리 구현 모두와 어긋남).
  - **Epic 소속 칩**: 각 항목 행에 "어느 Epic 소속인지" 칩 한 컬럼(EpicChip, Epic 색=violet). Epic 자신엔 미표시.
  - **Epic 필터**: 백로그 상단 드롭다운으로 특정 Epic 소속만 좁혀 보기(큰 묶음 단위 조망 — 사용자 수요 "Epic으로 묶어 보기").
  - **인라인 생성**: 각 구역 하단 `+ 만들기` → 모달 없이 제목 입력→Enter. 스프린트 구역이면 그 sprintId, Epic 필터 활성 시 그 epicId로 프리필. 연속 생성.
  - **Epic 연결 2경로(Jira 동일)**: ① **업무 상세 사이드 패널 "상위 항목" 드롭다운**(DetailSidePanel) — Epic 후보(프로젝트 EPIC 목록)에서 골라 `PATCH /work-items/{id}` epicId. Epic·Sub-task엔 미노출. ② **백로그 행 Epic 칩 클릭→드롭다운**(BacklogRow) — 칩(또는 "Epic 지정")이 ds-ui Select 트리거가 되어 그 자리서 Epic 변경. 구 ConvertDialog의 "숫자 id 직접 입력"(실사용 불가)을 대체.
- **변경 내용**:
  - **T3-3**: §6.1 백로그 "Epic 펼침 트리" → "평면 + 소속 칩 + 필터(원전·Jira 근거 명기)". §9.3 상세 사이드 패널에 "상위 항목(Epic 연결)" 추가. 페이지 목록·컴포넌트 매핑·placeholder 표기 동반 정정.
  - **FE 구현**: ① `EpicChip`(badges.tsx) ② `BacklogRow` epicName 칩 + epicOptions/onChangeEpic(칩 클릭 드롭다운) ③ `InlineCreateRow`(신규) ④ `SprintSection` epicName·epicOptions·onChangeEpic·onInlineCreate prop ⑤ `BacklogView` Epic 맵·필터·인라인 생성·Epic 변경 핸들러 ⑥ `epic-filter.ts`(순수 함수) ⑦ `DetailSidePanel` "상위 항목" Epic Select ⑧ `useChangeEpic` 훅(projectId 단위) ⑨ `CreateWorkItemRequest`에 sprintId 추가(BE CreateRequest는 이미 지원, FE 타입만 누락이었음).
- **BE 무변경**: `POST /work-items`(CreateRequest.sprintId·epicId 이미 존재)·`PATCH /work-items/{id}`(UpdateRequest.epicId 이미 존재)·`GET /work-items?projectId=`(Epic 목록) 재사용. 신규 엔드포인트·테이블·에러코드 없음. work_item 단일 테이블·epicId 느슨연결(BIZ-014) 무변경.
- **테스트**: epic-filter.test.ts 4/4 PASS(node 환경, agile 합계 9/9). tsc -b + vite build 통과.
- **영향 설계서**: T3-3(1종).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-28, "지라 방식대로"·백로그 화면까지만) | **적용 버전**: v2.1
- **변경 일자**: 2026-06-28

### CR-023 — 타임라인 에픽 WBS 그룹 + 에픽 필터 + 시간단위 4토글(오늘/주/개월/분기)

- **변경 타입**: 신규 | **영향도**: Medium(보기 모듈 — 타임라인, FE 한정, 신규 BE 0)
- **상태**: 설계 캐스케이드(2026-06-28). 구현 진행.
- **배경**: 사용자가 Jira 타임라인 캡처(에픽 행 펼침 `>` + 우하단 오늘/주/개월/분기 토글)를 첨부하며 "우리 타임라인에도 에픽으로 필터링 + 오늘/주/개월/분기 토글 + 에픽=상위 그룹 WBS 형태"를 요구. 실측: 현재 TimelineChart는 항목 평면 나열 + 월 눈금 단일, 에픽 그룹·필터·단위 토글 없음(CR-021 월/주 토글은 미구현 상태였음 → CR-023이 4단위로 흡수).
- **핵심 설계 결정(사용자 합의)**:
  - **에픽 = 1단 상위 그룹(WBS식 펼침 트리).** 에픽 행(펼침 토글 + Epic 배지 + 롤업 막대) 아래 하위 항목 들여쓰기. 에픽 미지정은 "(에픽 없음)" 그룹.
  - **백로그(CR-022 평면)와 다른 표현은 의도된 것**: 백로그=항목 평면(원전·Jira 근거 펼침 폐기), 타임라인/로드맵=에픽 롤업 펼침(Jira도 두 화면 분리). 같은 epicId(BIZ-014 느슨 그룹핑)를 화면 목적에 맞게 다르게 투영. 데이터·계층 무변경.
  - **에픽 필터**: 다중선택(Popover+Checkbox). 클라이언트 필터링(데이터 재호출 없음).
  - **시간 단위 토글 = 오늘/주/개월/분기 4단위**, 기본 개월. **"구간 한정 + 줌"**(사용자 선택): 단위별로 눈금 밀도(줌) + 표시 구간을 오늘 기준 창으로 한정. "오늘" 세로선 표시. 화면 로컬 state.
- **변경 내용**:
  - **T3-3**: 타임라인 §에 에픽 WBS 그룹·에픽 필터·4단위 토글(구간한정+줌) 명세 추가. 백로그 평면과의 차이 근거 명기.
  - **FE 구현(예정)**: ① `timeline-util` — 단위별 표시구간(window) + 눈금(주/월/분기/일) + 에픽 그룹핑/롤업 막대 순수 함수 ② `TimelineChart` — 에픽 행(펼침/접기)·들여쓰기·에픽 필터 Popover·4단위 Button group·오늘 세로선 ③ 에픽 이름 매핑용 `GET /work-items?issueType=EPIC` 조회 훅.
- **BE 무변경**: `GET /projects/{id}/timeline`(epicId 이미 포함)·`GET /work-items?issueType=EPIC`(에픽 목록) 재사용. 신규 엔드포인트·테이블·에러코드 없음.
- **영향 설계서**: T3-3(1종).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-28, 중규모·구간한정+줌) | **적용 버전**: v2.1
- **변경 일자**: 2026-06-28

### CR-024 — 업무 설명란 Tiptap 리치 에디터 + 로컬 파일 업로드 API

- **변경 타입**: 신규 | **영향도**: Medium(단일 모듈 — work_item 설명 입력, BE 파일 업로드 1종 신규)
- **상태**: 설계 캐스케이드(2026-06-28). 구현 대기(사용자 승인 후 착수).
- **배경**: E2E_UX피드백 #17 "업무 만들기 설명란을 에디터로 하자". 직전 세션은 "에디터화는 과함, plain Textarea 유지"로 결론냈으나, 사용자 의도 재확인 결과 **에디터 도입이 목적**이었음. 실측으로 두 사실 확정 — ① 만들기 모달 설명과 상세 설명은 **같은 1필드(`description`)**, 입력 지점만 둘(모달=Textarea, 상세=TextBlock 둘 다 plain). ② T3-3 설계는 **이미 "리치 텍스트/리치 에디터(이미지 포함)"로 정의**돼 있었음(§9.3·§9.4·320줄 RichEditor) → 구현이 설계보다 낮게 내려간 상태였음. 즉 CR-024는 "설계대로 끌어올리는" 정합 + 파일 업로드(Phase 2로 미뤄둔 것)를 당겨 옴.
- **핵심 설계 결정(사용자 합의)**:
  - **에디터 = Tiptap**(조직 일관성 — axopm이 이미 Tiptap v3 IssueEditor 운영, react-quill은 axopm에서도 미사용). axopm IssueEditor 패턴 포팅, ds-ui(shadcn) Button/Popover 기반.
  - **적용 = work_item `description` 1필드, 만들기 모달 + 상세 양쪽 동일 컴포넌트.** "만들기는 가볍게"는 필드 수를 줄인다는 뜻이지 설명 입력기를 낮추는 게 아님 → 설명은 만들 때부터 풀 에디터.
  - **저장형식 = HTML 문자열.** `work_items.description` 컬럼 `text` **무변경**(HTML도 결국 텍스트). 표시 지점만 HTML 렌더 / 목록·검색·타임라인 미리보기는 태그 strip.
  - **이미지 = 별도 파일, 에디터엔 URL(링크)만.** description엔 `<img src="URL">`만 박힘(바이너리 미저장). 사용자 직관대로 — axopm도 동일.
  - **파일 저장 = 서버 로컬 디스크.** 경로 `application.yml` 설정값으로 조정(`workmap.upload.dir` 기본 `/home/therecommerce/workmap/uploads/`). S3 등은 추후 교체.
- **변경 내용**:
  - **T3-2**: F3 "파일 업로드(리치 에디터 인라인 이미지)" 섹션 신규 — `POST /files/upload`(multipart→URL)·`GET /files/serve/{name}`(정적 서빙, 화이트리스트 공개). 에러코드 **WMP-7809~7813**(초안 7803~7805는 WS·탭이 점유 중이라 실측 후 정정). work_item 비종속 독립 경로(만들기 시점 ID 부재).
  - **T3-3**: §9.3·§9.4 설명란에 CR-024 정합 주석(Tiptap·HTML 저장·이미지 URL 삽입·모달=상세 동일 컴포넌트).
  - **BE 구현(예정)**: `FileUploadController`·`FileStorageService`(로컬 디스크, UUID 파일명, 타입 화이트리스트) + `application.yml` `workmap.upload.*` + `spring.servlet.multipart.max-file-size` + WmpErrorCode 3종. `work_items.description` 스키마·기존 Attachment 메타 테이블 **무변경**.
  - **FE 구현(예정)**: 공용 `RichTextEditor`(Tiptap, axopm IssueEditor 포팅, 이미지=업로드 API 호출) + 만들기 모달·DetailBody 설명란 교체 + 목록/검색 미리보기 HTML strip 유틸.
- **영향 설계서**: T3-2·T3-3(2종).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-28, 로컬 디스크 저장·설정값 조정) | **적용 버전**: v2.1
- **변경 일자**: 2026-06-28

### CR-025 — Jira 스크럼 정합 보정 3종(착수일 자동·라벨 필터·DOC 유형)

- **변경 타입**: 설계보정 | **영향도**: Low(단일 모듈 — work_item, 신규 BE 0·시드 1)
- **상태**: 구현 완료(2026-06-28). 단위테스트 PASS·FE 빌드 통과. 운영 배포 대기.
- **배경**: 사용자가 Jira 스크럼 운영 블로그(velog @jinuku)를 첨부하며 "여기 설명대로 우리도 동작하는지 실측"을 요청. 블로그 동작 규칙 vs WorkMap 코드를 영역별로 실측한 결과 핵심 동작(계층·백로그·보드·스프린트 FSM·상태전이·포인트·번다운)은 구현돼 있었으나 **3종이 미달**로 확인 — ① IN_PROGRESS 진입 시 start_date 자동설정 없음(블로그 명시 동작) ② 라벨은 입력만 되고 필터 불가(SearchCriteria/SQL 미구현) ③ Doc(문서) 유형 부재(블로그 구조의 6번째 유형). 사용자가 이 3종 구현을 지시(소규모 판단). 플래닝 포커·Git 연동은 제품 범위 밖으로 제외 합의.
- **핵심 설계 결정(실측 근거)**:
  - **DOC는 IssueType enum 추가가 필수.** `parseIssueType("DOC")`(WorkItemService:467)이 enum 미존재 시 INVALID_REQUEST를 던져 DOC 생성 자체가 막힘 → 시드 SQL만으로 불충분. enum에 `DOC(1)` 추가.
  - **DOC는 depth 1이되 Sub-task 부모 불가.** 블로그 구조(Story/Dev만 Subtask를 가짐)에 맞춰 `canBeSubtaskParent`에서 EPIC·DOC·SUBTASK 제외. EPIC/STORY/TASK/BUG/DOC/SUBTASK 6종 체계.
  - **start_date는 "비어있을 때만" 오늘로 설정.** 이미 값이 있으면 덮어쓰지 않음. updateStatus 쿼리에 start_date가 없어 함께 보강(없으면 set해도 DB 미반영).
  - **라벨 필터는 JSONB 포함 연산(`@>`).** labels가 JSONB 배열이라 `=` 대신 `labels @> jsonb_build_array(#{label})`.
- **변경 내용**:
  - **BE**: ① `WorkItemService.changeStatus`에 IN_PROGRESS 착수일 자동 + `WorkItemMapper.xml` updateStatus에 start_date 컬럼 추가 ② `WorkItemSearchCriteria`·`WorkItemDtos.SearchParams`·`WorkItemQueryService`에 `label` 추가 + Mapper searchWhere 라벨 필터(@>) ③ `IssueType` enum DOC 추가·canBeSubtaskParent 보정 + **V7__doc_issue_type.sql**(issue_type DOC 시드 + 시스템 템플릿 issue_type_codes에 DOC 편입).
  - **FE**: `types/domain.ts`(IssueType·라벨·색에 DOC=amber) + `badges.tsx`(TYPE_ICON DOC=FileText·TYPE_BG amber) + `search/api.ts`(label 파라미터) + `SearchPage`(라벨 SearchInput 필터) + `filter-codec`(저장필터 label).
- **BE 신규 0(엔드포인트·에러코드 무신규), 스키마 무변경(시드 V7 1개만), work_item 단일 테이블·description 무변경.**
- **테스트**: WorkItemServiceTest 신규 4건(FSM-13/14 착수일 자동·유지, HRC-7/8 DOC 생성·부모불가) — `./gradlew test` BUILD SUCCESSFUL. FE tsc -b + vite build(3467 modules) 통과.
- **영향 설계서**: 없음(설계 정합 보정 — 기존 계층/검색 명세 범위 내, DOC는 BIZ-107 "유형 추가는 마스터 행" 정책대로).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-28, 3종 모두·소규모·CR 부여) | **적용 버전**: v2.1
- **변경 일자**: 2026-06-28

### CR-026 — 커뮤니케이션(채팅) 모듈 신규 — axopm comm 포팅(워크스페이스 단위 Slack형)

- **변경 타입**: 신규 기능(대규모) | **영향도**: High(신규 도메인 `chat` 1종 — 테이블 11·엔드포인트 다수·FE 신규 화면/메뉴)
- **상태**: 구현 완료(2026-06-29). BE 단위테스트 173/173 PASS·FE tsc+build(3479 modules) 통과. 운영 배포·화면 E2E 대기.
- **배경**: 사용자가 "axopm의 커뮤니케이션 기능(Slack 유사)을 WorkMap에 포팅" 지시. axopm `opm-comm` 모듈(채널/메시지/스레드/리액션/멘션/첨부/읽음커서/북마크/핀/멤버/알림설정 + STOMP 타이핑) 실측 → **그대로 복붙 불가**: axopm은 JPA/Repository·UUID·MySQL인데 WorkMap은 MyBatis(JPA 금지)·BIGINT IDENTITY·PostgreSQL. "포팅"의 실체는 **MyBatis로 재구현 + WorkMap 기존 자산(Tiptap 에디터·FileStorage·인증·이벤트) 재활용**. 사용자 결정으로 설계 캐스케이드 생략(B: "있는 기능 포팅이라 코어부터 구현").
- **핵심 설계 결정(사용자 합의)**:
  - **범위 = 풀셋(타이핑 제외)**: 채널·메시지·스레드답글·리액션·멘션·첨부·읽음커서·북마크·핀·채널멤버·알림설정.
  - **채널 스코프 = 워크스페이스 단위**(슬랙식, ws-ia-decision 정합). axopm의 `project_id`·`opm_*`(OPM 이벤트 연동) 컬럼 제외.
  - **실시간 = 폴링**(타이핑을 빼면 STOMP 필수 기능 없음). 메시지/채널 TanStack Query `refetchInterval` 5초. STOMP 미도입(추후 CR 여지).
  - **ID/타입 변환**: CHAR(36) UUID→BIGINT IDENTITY, LONGTEXT→TEXT, DATETIME(6)→TIMESTAMPTZ. 작성자명은 axopm처럼 비정규화 저장하지 않고 `users.name` LEFT JOIN(정규화).
  - **본문 = Tiptap HTML**(CR-024 RichTextEditor 재사용). 메시지/답글 `content_html`.
- **변경 내용**:
  - **DB**: **V8__chat_module.sql** — `chat_channels/messages/replies/reactions/read_cursors/mentions/attachments/pins/bookmarks/notification_settings/channel_members` 11테이블(PG16, BIGINT PK, 스칼라 컬럼만 — JSONB 없음).
  - **에러코드**: **WMP-7820~7828** 9종(CHAT_*) — 채널/메시지/답글 NOT_FOUND·FORBIDDEN·중복·시스템보호·내용필수.
  - **BE**: 도메인 11 + 매퍼 10(인터페이스+XML) + DTO(ChatDtos record) + 서비스 6(채널/메시지/리액션/Enhanced + 헬퍼 2) + 컨트롤러 4(Channel/Message/Reaction/Enhanced). 응답 `ResponseDto`, 인증 `@AuthUserInfo("userId")`, workspaceId는 쿼리/바디 수령. unreadCount=읽음커서 기반.
  - **FE**: `features/chat/`(api·hooks·types·components 8) + `ChatPage`(3패널: 채널 사이드바/메시지 패널/스레드 패널) + LNB '메시지' 메뉴 + `/chat`·`/chat/:channelId` 라우트. ds-ui만(네이티브 위젯 0).
  - **테스트 보정(CR-009 함정 재현)**: 신규 chat 매퍼 10종을 Project/User/WorkItem `@WebMvcTest`에 `@MockBean` 추가(누락 시 `@MapperScan`이 슬라이스에 적용돼 SqlSessionFactory 없이 빈 생성→컨텍스트 로딩 실패).
- **BE↔FE 계약 경로 16종 전수 일치 교차검증 완료.**
- **미구현(후속)**: 멘션 @자동완성 UI(저장 배선만, 현재 빈 배열 전송)·멘션→알림 연동, 첨부 업로드 API 배선(테이블·도메인만, 에디터 인라인 이미지는 RichTextEditor로 동작), STOMP 실시간.
- **영향 설계서**: 없음(B 결정으로 설계 캐스케이드 생략 — 사후 역생성 시 T3-1/T3-2/T3-3에 chat 추가 예정).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-29, B=설계 스킵·코어부터·워크스페이스 단위·타이핑 제외·폴링) | **적용 버전**: v2.2
- **변경 일자**: 2026-06-29

### CR-027 — 이메일 초대 가입 + 비밀번호 재설정/변경(인증번호 OTP) + bp-notification 연동

- **대상 기능 ID**: WMP-AUTH-004(재정의)/006/007/008/009(신규)
- **변경 타입**: 신규 기능(대규모) | **영향도**: High(가입·인증 경로 변경, 신규 테이블 2·외부 연동 1·FE 신규 화면 3)
- **상태**: **설계 캐스케이드 완료(2026-06-29). 구현 미착수(사용자 승인 후 진행).**
- **배경**: 사용자가 "회원가입 시 초대 이메일을 보내고 링크를 타고 들어오면 비밀번호 설정, 추후 비밀번호 변경도 같은 메커니즘으로. 이메일은 bp-notification 솔루션에 소비앱 정보 추가하여 진행" 지시. 기존 가입 경로는 관리자가 `POST /users`로 초기 비밀번호를 직접 지정하는 방식이었음(self-service·이메일 발송 없음).
- **핵심 설계 결정(사용자 합의 2026-06-29)**:
  - **초대 = invitations 테이블만**, user는 즉시 생성하지 않고 **수락(인증번호+비밀번호 설정) 시점에 생성**. → `users.password_hash NOT NULL`·로그인 단일경로 불변식 보존(half-baked user 회피). 사용자 직감("초대는 invitations만") 채택.
  - **본인확인 수단 = 이메일 6자리 인증번호(OTP) 전면 통일** — 초대·분실재설정·변경 모두 인증번호. (초기 토큰링크 안 → 사용자가 인증번호 통일 선택.)
  - **비밀번호 변경(로그인 상태) = 현재 PW + 인증번호 2차 인증** (사용자 의견 반영 — 변경에도 인증번호). 분실재설정(forgot)은 이메일+인증번호.
  - **OTP 정책(POL-013)**: 6자리·만료 10분·시도 5회·재발송 쿨다운 60초·1회용·평문 미저장(해시). 단일 `email_otp` 테이블로 3용도(INVITE/RESET/CHANGE) 통일.
  - **계정 열거 방지**: forgot은 미존재/비활성 이메일도 동일 성공 응답(발송 안 함).
  - **bp-notification 연동**: WorkMap을 solutionCode `WMP`로 솔루션 등록(EMAIL), 발급 apiKey로 `POST /messages/email` 호출. 템플릿 3종(`WMP_INVITE_OTP`/`WMP_RESET_OTP`/`WMP_CHANGE_OTP`). 발송은 best-effort(실패가 OTP 발급 트랜잭션 막지 않음).
- **변경 내용(설계)**:
  - **T1-1**: WMP-AUTH-004 "사용자 생성/초대"→"사용자 초대(이메일 인증번호)"로 재정의 + WMP-AUTH-006/007/008/009 신규.
  - **T1-4**: POL-012(비밀번호 정책)·POL-013(OTP 정책) 신규.
  - **T1-6**: UserInvited·UserJoined·PasswordChanged 이벤트 신규(인프로세스 활동/감사. 인증번호 발송 자체는 이벤트 아닌 동기 호출).
  - **T3-1**: `invitations`·`email_otp` 테이블 신규(users 무변경, **V9** — 구현 착수, `V9__invitations_email_otp.sql`).
  - **T3-2**: §A 인증에 accept/forgot/reset/change/change-request-otp 5종 + §B에 `/invitations` CRUD(생성·목록·재발송·취소). `POST /users`는 직접 생성(시드용)으로 유지.
  - **T3-3**: `/invite/accept`·`/password/forgot`(공개)·`/account/password`(인증) 3화면 신규 + 로그인 화면 forgot 링크.
  - **execution-spec**: §5 CR-027 횡단 가이드(bp-notification 사전등록 절차·BE/FE 작업·함정·에러코드 WMP-7829~7838).
- **영향 설계서**: T1-1, T1-4, T1-6, T3-1, T3-2, T3-3, execution-spec, CLAUDE.md(에러코드/진행상태)
- **에러코드**: WMP-7829~7838(INVITATION_* 4·OTP_* 5·PASSWORD_SAME_AS_CURRENT 1). 7820~7828은 채팅(CR-026) 점유. 현재PW불일치=기존 7742, 이메일중복=기존 7741 재사용.
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-29, 설계 캐스케이드 먼저·구현은 승인 후 / 초대=invitations만 / 인증수단=OTP 통일 / 변경=현재PW+OTP 2차) | **적용 버전**: v2.2
- **변경 일자**: 2026-06-29

#### CR-027 보정 (2026-06-29, 토큰 전환) — 초대·분실재설정 OTP → 링크 토큰

- **배경**: 운영 발송 E2E에서 받은 초대 메일에 **수락 화면 링크가 없어** "인증번호만 받고 어디로 가는지 모르는" 문제 발견(사용자 캡처). 더 본질적으로 사용자가 "링크 방식이면 인증번호가 불필요하고, 링크가 아닌 것(forgot 등)에만 필요하다"고 정리 → **메일을 받아 링크 클릭하는 것 자체가 메일함 접근=본인확인**이므로 초대·forgot 둘 다 링크면 OTP 불필요. (애초 첫 요구가 "링크 타고 들어오면 비번 설정"이었는데 중간에 OTP 통일로 빗나갔던 것을 원복.)
- **보정 결정(사용자 합의 2026-06-29)**:
  - **초대(INVITE)·분실재설정(RESET) = 토큰 링크** — 인증번호 입력 제거. 메일의 버튼 클릭 → (초대)비번 설정·가입 / (재설정)새 비번. 링크 `http://59.8.160.12:3186/invite/accept?token=...`·`/password/reset?token=...`.
  - **변경(CHANGE)만 인증번호 유지** — 로그인 상태 화면 변경은 메일 링크 맥락이 없어 현재PW+OTP 2차 인증 그대로(POL-013-B).
  - **토큰 정책(POL-013-A)**: 추측 불가 랜덤(해시 저장), 초대 72h·재설정 30분 만료, 1회용, 시도제한 불요(고엔트로피).
- **변경 내용(설계 재갱신)**: T1-1(004/006/007/009 토큰 재정의) · T1-4(POL-013을 토큰+OTP 혼합으로) · T1-6(토큰 평문 비포함) · T3-1(invitations.token_hash + `password_reset_tokens` 신설 + email_otp는 CHANGE 전용 축소, **V11**) · T3-2(GET `/auth/invitations/{token}` 미리보기 추가, accept/forgot/reset를 토큰 바디로) · T3-3(`/invite/accept` 토큰 미리보기·`/password/reset` 신규 라우트, 인증번호 칸 제거).
- **구현 영향**: email_otp INVITE/RESET 발급 경로 제거(CHANGE만), TokenService 신규, InvitationService·PasswordService 토큰 기반 재작성, FE 초대수락·비번찾기 화면 토큰화 + `/password/reset` 신규. bp-notification 템플릿 `WMP_INVITE_OTP`/`WMP_RESET_OTP` → `WMP_INVITE_LINK`/`WMP_RESET_LINK`(actionUrl 버튼)로 교체. 에러코드: OTP_* 일부는 TOKEN_*로 대체(7833~7837 재사용 또는 신규 — 구현 시 확정).
- **상태**: **설계 재갱신 완료(2026-06-29). 구현 착수 예정.** (앞선 OTP 구현분 e598eaa는 BE 배포돼 있으나 FE 미배포 상태 — 토큰 전환으로 교체.)
- **2단계 후속(별도 CR 예정)**: 로그인 화면에서 **사용자가 관리자에게 가입 요청**(셀프 신청 → 관리자 승인 시 역할 지정·초대 발송). `signup_requests` 도메인 + `/signup-request` 공개 화면. 토큰 재설계 완료 후 착수(같은 초대 인프라 재활용).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-29, 토큰 전환 / 초대·forgot=링크 / 변경=OTP 유지 / 중규모 설계 먼저) | **적용 버전**: v2.2

### CR-028 — 각종 알림 확장: 트리거 발행 구현 + 외부 채널(bp-notification) + 수신 설정

- **대상 기능 ID**: WMP-NOTI-001(구체화)/002(구체화)/003·004·005(신규) · WorkItemCommented(이벤트 신규)
- **변경 타입**: 신규 기능(대규모) | **영향도**: High(알림 발행 경로 중앙화, 신규 테이블 2·외부 연동 1·FE 신규 화면 1·스케줄러 1)
- **상태**: **설계 캐스케이드 완료(2026-06-29). 구현 미착수(사용자 승인 후 진행).**
- **배경**: 기존 알림은 배정·멘션·막힘 3종 발행 + 인앱 받은함만 존재(실측). T1-6에 마감임박/초과·스프린트·승인 이벤트는 **계약만 선정의**돼 있고 발행 구현이 없었음. 사용자가 "각종 알림 기능"을 요청 → 선정의 이벤트의 발행 구현 + 외부 전달(이메일/푸시) + 사용자 수신 설정을 추가.
- **핵심 설계 결정(사용자 합의 2026-06-29)**:
  - **알림 종류 = 전체** — 배정·멘션·막힘(기존) + 댓글·상태변경·마감임박·마감초과·스프린트 시작/완료·승인 요청/처리(신규). T1-6 선정의 계약 기반.
  - **인앱 받은함 = 원장(항상 기록)**, 외부 채널(이메일/푸시)은 사용자 설정에 따라 fan-out. 단일 진입점 `NotificationDispatcher`.
  - **수신 설정 기본값 = 인앱 ON · 이메일 OFF · 푸시 OFF**(sparse 저장, 미설정은 기본값).
  - **외부 채널 = bp-notification 자체 솔루션 활용**(사용자 결정) — Slack/Webhook 자체 구현 안 함. CR-027과 솔루션(`WMP`)·apiKey 공유.
  - **CR-027과 별도 CR**(사용자 결정) — 공통 인프라(bp-notification 클라이언트)는 CR-028이 만들고 CR-027이 재사용. 인증/이메일(CR-027)과 업무 알림(CR-028) 분리.
  - **마감 알림 = 스케줄러**(매일 오전 due_date 스캔), 같은 항목·타입·날짜 1회.
- **변경 내용(설계)**:
  - **T1-1**: WMP-NOTI-001/002 구체화 + WMP-NOTI-003(수신 설정)·004(외부 전달)·005(마감 스케줄러) 신규.
  - **T1-4**: POL-009 구체화(2층 제어 — 전역 트리거 on/off + 사용자 종류×채널 설정).
  - **T1-6**: WorkItemCommented 이벤트 신규. 외부 발행을 Phase 3+→CR-028 조기 도입으로 명기. NotificationDispatcher 단일 진입점.
  - **T3-1**: `notification_preferences`·`fcm_tokens` 테이블 신규(notifications 무변경, type VARCHAR 확장만, **V10 예정** — V9는 CR-027 점유). NotificationType 11종.
  - **T3-2**: §L에 `/notification-preferences`(GET/PUT)·`/fcm/token`(POST/DELETE) + `/notifications/unread-count` 보강.
  - **T3-3**: `/account/notifications` 알림 수신 설정 매트릭스 화면 신규.
  - **execution-spec**: §5 CR-028 횡단 가이드(bp-notification 템플릿 등록·Dispatcher·GatewayClient·스케줄러·함정·에러코드 WMP-7839~7841).
- **영향 설계서**: T1-1, T1-4, T1-6, T3-1, T3-2, T3-3, execution-spec, CLAUDE.md(에러코드/진행상태)
- **에러코드**: WMP-7839~7841(NOTIFICATION_NOT_FOUND·NOTIFICATION_PREFERENCE_INVALID_TYPE·FCM_TOKEN_REQUIRED). 7820~7828=채팅(CR-026), 7829~7838=CR-027 예약. 외부 발송 실패는 에러코드 아님(best-effort).
- **마이그레이션 번호**: CR-027 구현이 **V9**(`V9__invitations_email_otp.sql`, 작업트리 확인)를 이미 점유. 따라서 CR-028은 **V10**(notification_preferences·fcm_tokens). 구현 착수 시 미적용 마이그레이션 최대 번호 재확인 후 부여.
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-29, 알림 종류 전체 / 인앱 ON·외부 OFF / bp-notification 활용 / CR-027과 별도 CR / 설계 먼저·구현은 승인 후) | **적용 버전**: v2.2
- **변경 일자**: 2026-06-29

### CR-029 — 모바일 앱(Capacitor 래핑): App Shell 구현 + 푸시/카메라/음성 설계 선기재

- **대상 기능 ID**: WMP-APP-001(신규·구현) / WMP-APP-002·003·004(신규·설계만)
- **변경 타입**: 신규 기능(중규모) | **영향도**: Medium(FE 패키징 인프라 추가. BE/API/스키마 변경 0)
- **상태**: **설계 캐스케이드 완료(2026-06-29). 구현 미착수(사용자 승인 후 진행).**
- **배경**: 사용자가 "앱용으로도 제작하고 싶다, 할 수 있는 것 위주로. 추후 카메라·푸시·음성도 들어갈 것"이라 지시. 셋(카메라·푸시·음성)이 확정 로드맵이므로 PWA의 iOS 제약(웹푸시·음성인식 반쪽)을 피해 **Capacitor 래핑**(현 React/Vite 코드 재활용, RN 신규작성 안 함) 채택. 참고 구현 `dev-labs/bp-issues-front`(동일 조직 Capacitor 8 + push) 실측.
- **핵심 설계 결정(사용자 합의 2026-06-29)**:
  - **방식 = Capacitor 래핑**(PWA·RN 대신). 근거: iOS에서 푸시/카메라/음성이 PWA로는 반쪽 → 셋이 로드맵 확정이면 처음부터 네이티브 브리지. 현 FE 자산 100% 재활용.
  - **타깃 = iOS/Android 둘 다.** (Xcode/Android Studio 설치 확인됨.)
  - **CR-029 범위 = App Shell(WMP-APP-001)만 구현.** 푸시/카메라/음성은 설계 선기재, 구현은 후속 CR(030+). 근거: "할 수 있는 것 위주로" — 껍데기 먼저, 기능은 따로 얹음.
  - **API 타깃 = 운영 BE 절대 URL 고정**(`http://59.8.160.12:8186`). 앱은 dev 프록시가 없어 절대경로 필수.
  - **BE 변경 0** — 푸시 토큰(`/api/v1/fcm/token` CR-028)·파일 업로드(`/files/upload` CR-024)는 이미 존재(실측 확인), 후속 기능 구현 시 재사용.
- **변경 내용(설계)**:
  - **T1-1**: 모듈 **J. 모바일 앱** 신규. WMP-APP-001(App Shell, 구현)·002(푸시, 설계)·003(카메라, 설계)·004(음성, 설계).
  - **execution-spec**: §5 CR-029 횡단 가이드(의존성·capacitor.config·API 절대URL 분기·스크립트·플랫폼 생성·기동 확인 + 푸시/카메라/음성 후속 구현 가이드·함정).
  - **T1-3~T1-6 / T3-1 / T3-2**: **무변경**(앱 패키징은 비즈규칙·FSM·이벤트·스키마·API 변경 아님). T3-3은 모바일 셸/레이아웃 점검 항목만 짧게 보강.
- **영향 설계서**: T1-1, execution-spec, T3-3(소), CLAUDE.md(진행상태). (T1-3/4/5/6·T3-1/2 무변경.)
- **에러코드**: 신규 없음(클라 패키징 — BE/API 무변경).
- **마이그레이션**: 없음(스키마 무변경).
- **참고**: `dev-labs/bp-issues-front` — `capacitor.config.ts`·`package.json` 스크립트·`src/hooks/usePushNotifications.ts`(FCM 토큰 BE 등록 패턴) 이식 대상.
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-29, Capacitor 채택 / iOS·Android 둘 다 / App Shell만 구현·푸시·카메라·음성 설계만 / API 운영BE 고정 / 설계 먼저) | **적용 버전**: v2.2
- **변경 일자**: 2026-06-29

---

### CR-030 — 개인 화면 테마: LNB 톤·포인트색 프리셋 선택(localStorage)

- **대상 기능 ID**: WMP-ACC-003(신규·구현) — 계정 영역 화면 테마 설정
- **변경 타입**: 신규 기능(중규모) | **영향도**: Low(FE 전용. BE/API/스키마/에러코드 변경 0)
- **상태**: **구현 완료(2026-06-29). 단위테스트 10/10 PASS·tsc+vite build 통과. 운영 배포·화면 E2E 미수행(다음 작업).**
- **배경**: 사용자가 "흑/백 위주라 밋밋하다"며 디자인 톤 논의 시작 → ds-ui 기본 `--primary`가 zinc-900(검정) 고정이라 버튼·링크·활성메뉴·진행률이 전부 무채색이던 것이 원인(실측). 단일 포인트색 시반(teal→indigo) 후, 사용자가 "면(LNB·GNB·버튼·바탕)별로 색을 정할 수 있게" 요구 → 면 분리 테마로 확장. 다크모드는 제외(포인트색·LNB 톤만), 저장은 localStorage(BE 무관·기기 단위).
- **핵심 설계 결정(사용자 합의 2026-06-29)**:
  - **면 분리 = 2개**: ① 포인트색(Accent — 버튼·링크·활성메뉴·진행률·포커스) ② LNB 톤(Sidebar+GNB 헤더 한 세트). 본문 바탕(`--background`)·상태색(`--wm-status-*`)은 **테마 무관 고정**(가독성·의미색 보존). 근거: Slack/Notion/Linear가 이 2면 구조. 면을 더 쪼개면 알록달록·CLAUDE.md "색 절제" 위반.
  - **선택 방식 = 프리셋 6종 카드**(자유 색상 선택 아님). 검증된 (LNB 톤+포인트색) 조합만 노출 → 난장판 방지.
  - **저장 = localStorage**(기기/브라우저 단위). BE preference 저장은 후속(구조는 BE 확장 가능하게 분리).
  - **다크모드 제외** — 배경은 라이트 고정. badges 등 라이트 전용 색 하드코딩을 손대지 않기 위함(다크는 별도 대규모 작업).
- **변경 내용(구현)**:
  - **FE 신규**: `lib/themes.ts`(프리셋 6종 + `applyTheme` 토큰 주입, ds-ui CSS 변수를 documentElement 인라인으로 덮어씀) · `store/theme-store.ts`(Zustand persist `workmap-theme`, rehydrate 시 주입) · `pages/AccountThemePage.tsx`(프리셋 카드, 클릭=즉시 전체 적용, 미니 프리뷰) · `main.tsx` 부트스트랩(첫 페인트 전 localStorage 직접 읽어 주입 → FOUC 방지).
  - **진입점**: `route-paths.accountTheme`(`/account/theme`) + App 라우트 + AppShell 계정 메뉴 "화면 테마"(Palette 아이콘).
  - **main.css**: 시반 하드코딩 `:root` 블록 제거(themes.ts 주입과 충돌 방지). GNB 헤더 배경/글자를 `var(--sidebar*)` 참조로 정식화 — 헤더 보조텍스트 색 강제는 `[data-sidebar-dark]`(다크 LNB 프리셋)일 때만 적용(라이트 프리셋 muted 위계 보존).
  - **프리셋 6종**: 기본(라이트·indigo) / 다크 사이드바(indigo) / 틸 / 다크+틸 / 블루 / 로즈. 첫 항목이 기본값.
  - **T1-1**: 모듈 I(계정) 등에 WMP-ACC-003(화면 테마) 신규. **T3-3**: "계정 > 화면 테마" 화면 추가.
  - **T1-3~T1-6 / T3-1 / T3-2**: **무변경**(클라 표현 설정 — 비즈규칙·FSM·이벤트·스키마·API 무관).
- **영향 설계서**: T1-1, T3-3, CR_변경_이력, CLAUDE.md(진행상태). (T1-3/4/5/6·T3-1/2 무변경.)
- **에러코드**: 신규 없음. **마이그레이션**: 없음(BE 무변경).
- **함정 회피**: ds-ui `dist/style.css`를 재빌드/재import하지 않음(LNB 클릭·hover 깨짐 트랩 — `workmap-tailwind-lnb-trap`). 색 변경은 CSS 변수 값 주입만이라 Tailwind 유틸 정렬 무관.
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-29, 면 2개 분리 / 프리셋 / localStorage / 다크모드 제외 / 중규모 착수 승인) | **적용 버전**: v2.2
- **변경 일자**: 2026-06-29

### CR-031 — VIEWER 읽기전용 강제: 쓰기 @PreAuthorize 가드 (설계 누락 보정)

- **대상 기능 ID**: WMP-AUTH-005(POL-004 역할 권한) — 전 쓰기 엔드포인트
- **변경 타입**: 설계보정(소규모) | **영향도**: Medium(보안 — 권한 경계. 다수 컨트롤러)
- **상태**: **구현 완료(2026-06-29). 단위테스트 212/212 PASS. 운영 배포·E2E 대기.**
- **배경**: 사용자가 역할 드롭다운(소유자/관리자/매니저/멤버/뷰어)의 차이를 질문 → 코드 실측 결과 **VIEWER(읽기전용, POL-004)가 코드상 강제되지 않음**을 발견. 업무(work-items) 쓰기 엔드포인트에 `@PreAuthorize`가 없어 VIEWER도 업무 생성·수정·삭제·상태변경이 가능했음(설계 의도 미구현). 설정(/admin/*)·프로젝트(/projects)·워크스페이스·초대는 이미 가드가 있어 VIEWER 차단되어 있었음 — 누락은 업무·스프린트·승인 영역뿐.
- **핵심 결정(사용자 합의 2026-06-29)**: ① 차단 범위 = 업무 쓰기 전체 + 프로젝트 쓰기(프로젝트는 이미 MANAGER+ 가드라 추가 불요). ② 수단 = 전역 역할 가드(`@PreAuthorize`, users.role 기준 — project_members.role 아님). ③ **제외 = 저장필터(개인 설정)·채팅(커뮤니케이션 참여)** — VIEWER도 허용(관람자 소통·검색 편의). 조회(GET)는 전부 허용.
- **변경 내용(구현)**:
  - **BE**: 공용 SpEL 상수 `common/security/WmpAuthz`(ADMIN/MANAGER/**WRITER**=`hasAnyRole('OWNER','ADMIN','MANAGER','MEMBER')` VIEWER 제외) 신규 — 권한 매핑 한 곳 관리(CLAUDE.md). 쓰기 메서드에 `@PreAuthorize(WmpAuthz.WRITER)` 추가: WorkItemController 10(생성/벌크/수정/삭제/하위작업/상태/담당자/유형전환/측정/스프린트) · WorkItemSubResourceController 4(댓글/첨부/링크 생성·삭제) · SprintController 3(생성/시작/완료) · OperationsController 2(백로그전환/현장검증) · ApprovalController 1(승인결정). **GET은 미적용**(조회 허용). @PreAuthorize 거부는 기존 WmpSecurityExceptionHandler가 403 매핑(에러코드 신규 불요).
  - **FE**: `lib/permissions.ts`(canWrite/canAdmin/canManageProject/`useCanWrite`) 신규 — 헤더 "만들기" 버튼을 VIEWER에게 숨김(서버 403과 일치하는 UX). 인라인 쓰기 버튼은 서버가 권위(누르면 toast).
  - **테스트**: WorkItemControllerTest에 AUTHZ-1(VIEWER 업무생성 403)·AUTHZ-2(VIEWER 상태변경 403)·AUTHZ-3(VIEWER 조회 200) 추가.
- **영향 설계서**: T3-2(§F 쓰기 가드 표기 보강), CR_변경_이력, CLAUDE.md. POL-004는 이미 "VIEWER 읽기전용" 명시 → T1-4 무변경(누락 구현 보정이므로). 스키마·에러코드·마이그레이션 없음.
- **남은 한계**: project_members.role(프로젝트별 역할)은 여전히 차등 권한 미구현(전역 역할만 강제) — 별도 후속. VIEWER 인라인 버튼 숨김은 헤더 만들기만 적용(나머지는 서버 403 의존).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-29, 업무+프로젝트 쓰기 차단 / 전역역할가드 / 저장필터·채팅 제외 / 소규모) | **적용 버전**: v2.2
- **변경 일자**: 2026-06-29

### CR-032 — 가입 요청(셀프 신청 → 관리자 승인 → 초대 발송)

- **대상 기능 ID**: WMP-AUTH-010(신규)
- **변경 타입**: 신규 기능(중규모) | **영향도**: Medium(신규 도메인 signup_requests·공개 API·관리자 화면. 인증 경로 확장)
- **상태**: **설계 캐스케이드 완료(2026-06-29). 구현 진행.**
- **배경**: 사용자 지시 "회원가입 창에서 반대로 사용자가 관리자에게 회원가입 요청하는 경우". 기존은 관리자가 먼저 초대(push)만 있었음 → 사용자가 스스로 신청하고 관리자가 승인하는 경로(pull) 추가. 로그인 화면의 "관리자에게 요청하세요" 안내를 실제 기능으로.
- **핵심 결정(사용자 합의 2026-06-29)**: ① 승인 흐름 = 승인 시 관리자가 역할 지정 → **기존 초대 플로우(CR-027 토큰 링크) 재사용** 발송(신청자는 링크로 비번 설정). ② 신청 입구 = **로그인 화면 "가입 요청" 링크** → `/signup-request` 공개 화면. ③ 관리자 알림 = **받은함/목록 표시만**(별도 이메일/인앱 발송 없음 — 후속 CR-028 인프라로 확장 가능). ④ 토큰 재설계(CR-027 보정) 완료 후 착수(같은 초대 인프라 위에 얹음).
- **변경 내용(설계)**: T1-1(WMP-AUTH-010 신규) · T3-1(`signup_requests` 테이블 — status PENDING/APPROVED/REJECTED, 부분유니크 대기 중복차단, **V12**) · T3-2(공개 `POST /auth/signup-requests` + Admin `GET/POST approve/reject`) · T3-3(`/signup-request` 공개 화면 + 로그인 링크 + `/admin/users` 대기 요청 섹션).
- **구현(예정)**: BE V12 + SignupRequest 도메인/매퍼/서비스/컨트롤러 + 승인 시 InvitationService.invite 위임 + 에러코드(SIGNUP_REQUEST_NOT_FOUND 등 7843~) + @WebMvcTest MockBean. FE `/signup-request` 화면·features 확장·UsersPage 대기 요청 섹션(승인 다이얼로그=역할 선택). 
- **영향 설계서**: T1-1, T3-1, T3-2, T3-3, CR_변경_이력, CLAUDE.md. (T1-4/5/6·T2 무변경 — 정책·FSM·이벤트 불변. 승인은 초대 재사용.)
- **에러코드**: WMP-7843~(SIGNUP_REQUEST_NOT_FOUND/ALREADY_PROCESSED/PENDING_DUPLICATED). 이미 가입=기존 7741 재사용. **마이그레이션**: V12.
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-29, 승인=역할지정 후 초대발송 / 로그인화면 링크 / 받은함 표시만 / 중규모) | **적용 버전**: v2.2
- **변경 일자**: 2026-06-29

### CR-033 — 초대·가입승인에 워크스페이스 지정 + 수락 시 자동 합류

- **대상 기능 ID**: WMP-AUTH-004/006/010(보정)
- **변경 타입**: 설계보정/신규(중규모) | **영향도**: Medium(초대/가입 경로에 WS 합류 추가. 신규 컬럼·화면 필드)
- **상태**: **설계 캐스케이드 완료(2026-07-02). 구현 진행.**
- **배경**: 운영 확인에서 **관리자 초대로 가입 완료한 사용자가 "속한 워크스페이스가 없습니다" 빈 화면에 갇힘** 발견(사용자 캡처). 실측: `InvitationService.accept`에 WS 합류 처리가 전혀 없었음 — user만 생성. CR-018 WS 격리(BIZ-112)로 신규 가입자는 아무 WS도 못 봄. **설계 구멍**(초대에 "어느 WS로 부를지"가 없었음).
- **핵심 결정(사용자 합의 2026-07-02)**:
  - **초대 = 관리자가 초대 시 WS 지정** → 수락 시 그 WS 자동 합류. (이견 없음 — "관리자가 속한 WS로 부르면 끝".)
  - **가입 요청(CR-032) = 사용자는 WS를 고르지 않음**. WS 모델(격리)에서 신규 신청자는 어떤 WS가 있는지 모르고 목록 노출도 불가(BIZ-112). 사용자는 "회사 합류"만 신청 → **관리자가 승인 시 역할+WS 지정** → 초대 발송 → 수락 시 지정 WS 합류. (슬랙 등도 셀프 가입은 도메인 기반이며 외부인이 WS를 고르지 않음 — 사용자 관찰 "WS 제품에서 사용자가 먼저 요청하는 걸 본 적 없다"와 일치.)
  - WS 없이 초대도 허용(workspace_id nullable) — 그 경우 가입 후 미소속(관리자가 별도 WS 추가).
- **변경 내용(설계)**: T1-1(004 입력에 WS·006 수락 시 자동합류·010 승인에 WS 지정) · T3-1(`invitations.workspace_id` nullable, **V13** + 수락 시 workspace_members 자동 insert=WorkspaceService.addMember 재사용, ON CONFLICT DO NOTHING) · T3-2(POST /invitations·/signup-requests/{id}/approve에 workspaceId) · T3-3(InviteDialog WS 선택=기본 현재 WS·가입요청 승인에 WS 선택).
- **구현(예정)**: BE V13 + Invitation 도메인/InviteRequest/ApproveRequest에 workspaceId + accept 시 `if(workspaceId!=null) workspaceService.addMember(wsId, userId)` + SignupRequestService.approve가 WS를 InviteRequest에 전달 + 테스트. FE InviteDialog WS Select(기본=workspace-store 현재 WS)·SignupRequestsSection 승인에 WS Select.
- **영향 설계서**: T1-1, T3-1, T3-2, T3-3, CR_변경_이력, CLAUDE.md. **에러코드 신규 없음**(WS 미존재=기존 7722 재사용). **마이그레이션**: V13.
- **요청자**: 사용자 | **승인자**: 사용자(2026-07-02, 초대=관리자 WS 지정 / 가입요청=승인 시 관리자가 역할+WS 지정 / 중규모) | **적용 버전**: v2.2
- **변경 일자**: 2026-07-02

### CR-034 — 목록 페이징 상태를 URL(?page=) 소유로 전환 (뒤로가기 리셋 버그 보정)

- **대상 기능 ID**: 횡단(SearchPage/InboxPage/ListView + admin 5종 — WMP-WI/NOTI/ADM 목록 화면 공통)
- **변경 타입**: 설계보정(중규모) | **영향도**: Medium(페이징 있는 전 화면의 상태 관리 위치 변경. 신규 API·스키마·에러코드 없음)
- **상태**: **설계 캐스케이드 + 구현 + 운영 배포(FE)·번들 서빙 검증 완료(2026-07-04). 브라우저 화면 E2E는 사용자 확인 몫.**
- **배경**: 운영에서 **검색/목록 N페이지 열람 → 업무 상세 진입 → 뒤로가기 시 1페이지로 리셋** 발견(사용자 캡처, 검색 4/5 → 1/5). 실측: `page`가 컴포넌트 로컬 `useState(0)`이라 상세(별도 라우트)로 이탈했다 뒤로가기하면 목록 컴포넌트가 재마운트되며 초기값(0)으로 돌아감. **React Router 상태 위치 오류**(네비게이션 종속 상태를 로컬 state에 둠).
- **핵심 결정(사용자 합의 2026-07-04, "정석으로")**:
  - 페이징 상태는 **URL 쿼리(`?page=`)가 소유**한다(Jira 동일 패턴). 컴포넌트 로컬 useState 금지. → 뒤로가기·새로고침·링크 공유에서 페이지 복원.
  - 공통 훅 `usePageParam(key='page')`로 강제(useState(0)과 동일 시그니처라 화면별 교체는 한 줄) + 공통 `Pager` 컴포넌트로 복붙된 페이저 통합(반복 패턴 일관성 규칙).
  - **범위**: page의 URL 소유까지. keyword/필터/퀵필터의 URL 동기화(전체 검색상태 공유 URL)는 별건으로 남김 — page 리셋 버그 해결에는 page URL화로 충분.
  - 버그 원인은 각 화면(FE)의 상태 위치이지 페이저 컴포넌트가 아니므로 **ds-ui 변경 없음**(별도 레포).
- **변경 내용(설계)**: T3-3에 "공통 UX 규약 — 목록 페이징 상태(전 화면 횡단)" 섹션 신설 — 페이징 상태 = URL 소유 원칙·이유(뒤로가기 복원)·`usePageParam`/공통 `Pager` 강제·적용 대상 명시.
- **구현**: `usePageParam` 훅 + 공통 `Pager` 신설 + 8개 화면 교체(SearchPage·InboxPage·ListView + admin IssueTypes/Users/FieldSchemes/Forms/MeasureUnits). 자체 페이저 3곳·admin 인라인 페이저 5곳 → 공통 Pager로 통합. usePageParam 단위테스트 7/7 PASS. tsc -b + vite build(3503 modules). **운영 배포(deploy.sh fe) + 실서빙 경로(:3186) 새 번들 반영·LNB 고정 규칙 유지 확인.**
- **영향 설계서**: T3-3, CR_변경_이력. **T1/T3-1/T3-2 무변경**(비즈규칙·스키마·API 계약 변경 아님). **에러코드·마이그레이션 없음.**
- **요청자**: 사용자 | **승인자**: 사용자(2026-07-04, "정석으로 해주세요" — URL 소유·8개 화면 전부·중규모) | **적용 버전**: v2.2
- **변경 일자**: 2026-07-04

### CR-035 — 타임라인 간트 고도화 (SVAR React Gantt — 드래그·의존성선·크리티컬패스)

- **대상 기능 ID**: WMP-VIEW-002(확장), WMP-VIEW-005(간트 고도화), WMP-VIEW-006(timeline 링크 병기)
- **변경 타입**: 변경(대규모) | **영향도**: High(신규 라이브러리 도입 + BE 응답 확장 + FE 타임라인 화면 전면 교체 + 크리티컬패스 신규 로직)
- **상태**: **설계 캐스케이드 완료(2026-07-04). 구현 착수 대기(사용자 승인 후).**
- **배경**: 사용자 요청 — Jira 타임라인(막대 드래그/리사이즈, 의존성선, 스프린트 오버레이) 수준으로 고도화. "React 라이브러리 vs 자체 개발" 검토 요청. 실측: 현 타임라인은 자체 div 막대(`TimelineChart.tsx` + `timeline-util.ts` 순수함수)로 **읽기(에픽 WBS·눈금·롤업·4단위 토글)는 완성**, **인터랙션(드래그·의존성선·크리티컬패스) 부재**.
- **라이브러리 조사 결과(2026-07-04)**: React 간트 6종 비교 → **완전 오픈소스(MIT)로 크리티컬 패스를 주는 유지보수 활발한 라이브러리는 없음**(SVAR·DHTMLX 모두 크리티컬패스=유료 PRO). frappe-gantt=WBS 트리 부재, gantt-task-react=React 19 미지원+정체.
- **핵심 결정(사용자 합의 2026-07-04)**:
  - 간트 UI = **SVAR React Gantt(`@svar-ui/react-gantt` 2.7.x, MIT)** 코어 채택. 근거: ① React 19 네이티브 지원 ② MIT(내부 상업 무료) ③ `wx-` 프리픽스+CSS 변수 스코프라 **Tailwind v4 LNB 함정에 가장 안전** ④ 드래그/리사이즈/의존성선/WBS 트리를 무료 코어가 커버.
  - **크리티컬 패스 = FE 순수함수 자체계산**(정공법). BE 계산이 아니라 items+links로 위상정렬+최장경로를 `timeline-util.ts`에 얹는다. 근거: 드래그 시 즉시 재계산 필요(파생 뷰), 기존 순수함수+단위테스트 패턴 계승, 오픈소스 라이브러리엔 어차피 없음.
  - **의존성 링크 = timeline 응답에 links[] 병기**(정공법, WMP-VIEW-006). 근거: 간트는 전체 그래프가 한 번에 필요(항목별 N회 조회 부적합), SVAR가 tasks[]+links[] 한 뭉치를 전제, 크리티컬패스도 전체 링크 그래프 필요.
  - **마커 리스크 명시**: SVAR 무료 코어는 오늘선·스프린트 밴드 미제공(PRO 유료) → **자체 absolute 오버레이 레이어**로 구현(기능 후퇴 방지).
- **변경 내용(설계)**:
  - T1-1: WMP-VIEW-005/006 신규 기능 정의 + 인벤토리 표 추가.
  - T3-2: `GET /projects/{id}/timeline` 응답 `{items[]}` → `{items[], links[]}` 확장. `TimelineLink{sourceId,targetId,linkType}`(BLOCKS만·중복제거). `ViewMapper.timelineLinks` 신규 쿼리. 드래그 저장=기존 `PATCH /work-items/{id}` 재사용(신규 엔드포인트 0).
  - T3-3: 타임라인 화면에 "간트 고도화(CR-035)" 하위 섹션 — SVAR 매핑·드래그 저장 배선(`update-task` inProgress 가드)·의존성선·크리티컬패스(FE 순수함수)·오늘선/스프린트 자체 오버레이·VIEWER `readonly`·테마 CSS 변수 매핑·좌측 그리드 Badge.
- **영향 설계서**: T1-1, T3-2, T3-3, execution-spec, CR_변경_이력. **T1-3(비즈규칙)/T1-4(정책)/T1-5(FSM)/T1-6(이벤트)/T3-1(스키마) 무변경** — work_item_links 기존 재사용, 상태전이·이벤트·스키마 변경 없음. **에러코드·마이그레이션 없음.**
- **미확인/리스크**: ① SVAR 막대 내부 커스텀 렌더 API 미확인(좌측 그리드 cell은 확인) → 설치 후 검증 ② 오늘선/스프린트 밴드 자체 오버레이 정합 ③ Tailwind v4 LNB 재확인([[workmap-tailwind-lnb-trap]]) — 배포 후 사이드바 확인 필수.
- **요청자**: 사용자 | **승인자**: 사용자(2026-07-04, "SVAR 코어+크리티컬패스 자체계산", "이 정공법으로 설계 진행", 대규모) | **적용 버전**: v2.3
- **변경 일자**: 2026-07-04

### CR-039 — 병렬 스프린트 + 보드 스프린트별 아코디언 (SPR-1 폐기)

- **대상 기능 ID**: WMP-AGL-003(시작, 완화)·WMP-AGL-005(보드, 응답구조 변경)
- **변경 타입**: 규칙 개정 + 응답구조 변경(BE+FE) | **영향도**: High(sprint FSM 규칙 개정 + 보드 응답 구조 + 보드 화면 재구성)
- **상태**: **설계 캐스케이드 완료(2026-07-05). 구현 착수.**
- **배경**: 사용자 요구 — Jira처럼 한 프로젝트에서 여러 스프린트를 동시에 진행(병렬 스프린트)하고, 보드에서 스프린트별로 아코디언(접기/펼치기) 섹션으로 세로로 쌓아 보고 싶음(Jira 보드 캡처 근거). 실측 결과 ① `SprintService.start`에 SPR-1 가드(동시 ACTIVE 1개, `ACTIVE_SPRINT_EXISTS`)가 병렬을 막고 있었고 ② `BoardService`가 `findActiveByProject`(LIMIT 1)로 단일 스프린트만 잡아 그 카드를 상태 컬럼으로만 뿌려 스프린트별 그룹(아코디언) 구조가 전무했음. 앞선 논의에서 "팀 도입/owner_id 필요"는 실측으로 부정 — 스프린트에 팀/인원을 붙이지 않는 것이 오히려 Jira 정합(스프린트는 그대로, SPR-1만 완화, 구분은 보드 그룹으로).
- **핵심 설계 결정(사용자 합의 2026-07-05)**:
  - **SPR-1 폐기**: 프로젝트당 동시 ACTIVE 스프린트 여러 개 허용. `start`에서 앞 ACTIVE 존재 검사 삭제. 스프린트 스키마 무변경(team_id/owner_id 불필요).
  - **그룹 기준 = 스프린트별**(에픽별 아님). 병렬 스프린트의 본질이 스프린트 구분이므로 보드는 ACTIVE 스프린트마다 아코디언 섹션 1개.
  - **표시 범위 = ACTIVE 전부만**. 백로그/FUTURE/COMPLETED는 보드에서 제외(기존 동작 유지). ACTIVE 0개면 스프린트 없는 단일 섹션(백로그 제외 전체 = 운영형 칸반, 기존 동작 보존).
  - **드래그**: 각 스프린트 섹션은 독립 DnD 컨텍스트. 드래그는 같은 섹션 내 상태 전이만(섹션 간 이동 없음 — 스프린트 변경이 아니라 상태만 바꾸는 화면).
- **변경 내용**:
  - **T1-1**: WMP-AGL-005 보드 설명 = "ACTIVE 스프린트별 그룹 × 상태 컬럼"으로 정정 + 병렬 스프린트 명시.
  - **T1-5**: sprint 규칙 "동시 ACTIVE 1개"→"여러 개 허용(CR-039)", FUTURE 비고의 시작 차단 조건 삭제, 불변식 7번 개정.
  - **T3-2**: `/board` 설명 = 스프린트별 그룹 + `/start` 설명 = 동시 ACTIVE 여러 개 + §G에 보드 응답 구조 상세(`groups[]`) 추가.
  - **T3-3**: 보드 화면에 병렬 스프린트 아코디언 섹션(Collapsible·독립 DnD·운영형 단일 섹션) 규약 추가.
  - **BE 구현**: `BoardDtos` = `BoardResponse{projectId, workflowId, List<SprintGroup> groups}` + `SprintGroup{sprintId, sprintName, startDate, endDate, columns[]}` (단수 `sprintId` 제거). `BoardService.board` = ACTIVE 스프린트 목록 순회하며 그룹 생성(0개면 null 그룹 1개). `SprintMapper.findAllActiveByProject`(신규, id 오름차순) + `SprintService.start`에서 SPR-1 가드 삭제.
  - **FE 구현**: `board/api.ts` `BoardResponse` 그룹 구조 반영. `BoardView`가 `groups`를 순회하며 스프린트별 `BoardAccordionSection`(ds-ui Collapsible 헤더 + `KanbanBoard`). 운영형(그룹1·sprintName null)은 헤더 없이 바로. `KanbanBoard`는 그룹 단위(컬럼셋)로 렌더하도록 board→columns 시그니처 조정.
- **스키마 무변경**: sprints/work_items 그대로. 신규 마이그레이션·에러코드 없음(`ACTIVE_SPRINT_EXISTS` 미사용 처리 — 코드 잔존해도 무해).
- **영향 설계서**: T1-1, T1-5, T3-2, T3-3, CR_변경_이력(5종). **T1-3/T1-4/T1-6/T3-1 무변경**.
- **테스트(예정)**: SprintServiceTest(앞 ACTIVE 있어도 다른 FUTURE 시작 성공 — 기존 "거부" 테스트 정정) + BoardServiceTest(ACTIVE 2개 → groups 2개, ACTIVE 0개 → null 그룹 1개). FE tsc -b + vite build + board 훅/렌더.

### CR-038 — 스프린트 편집·삭제 (Jira식 편집 폼 + …메뉴 편집/삭제)

- **대상 기능 ID**: WMP-AGL-007(편집, 신규), WMP-AGL-008(삭제, 신규)
- **변경 타입**: 신규(BE+FE) | **영향도**: Medium(agile 모듈 — 신규 엔드포인트 2종)
- **상태**: **설계 캐스케이드 완료(2026-07-04). 구현 착수.**
- **배경**: 사용자 관찰 — 현 스프린트 헤더에 시작/완료 버튼만 있고 Jira처럼 **편집·삭제 메뉴가 없음**(캡처). 실측 결과 BE(PATCH/DELETE 엔드포인트·Service·Mapper)·FE(다이얼로그·훅·…메뉴) 모두 전무. 생성 시 못 정한 기간·이름·목표를 뒤에 바로잡거나 잘못 만든 예정 스프린트를 지울 수단이 없었음.
- **핵심 설계 결정(사용자 합의 2026-07-04)**:
  - **편집 폼 필드**: 이름(필수)·**기간 프리셋**(1주/2주/3주/4주/사용자지정)·시작일·종료일·목표. Jira의 "자동 시작/완료 토글"은 BE 스케줄러가 필요해 이번 범위 제외.
  - **기간 프리셋**: 시작일 기준 프리셋 선택 시 종료일 자동계산(1주=+7일 등), 사용자지정이면 종료일 직접 입력. FE 편의 로직(BE는 startDate/endDate만 받음).
  - **편집은 어느 상태에서든 허용**(FUTURE/ACTIVE/COMPLETED). `status`는 편집으로 바꾸지 않음(전이는 start/complete FSM 전용).
  - **삭제는 FUTURE(예정)만 허용**. ACTIVE/COMPLETED 삭제는 FSM 가드에서 거부(데이터/이력 보호). …메뉴에서 삭제 항목은 FUTURE에서만 노출.
  - **삭제 시 담긴 워크아이템은 백로그로 복귀**(sprint_id=NULL) 후 스프린트 레코드 삭제(하드 삭제 — sprints는 소프트 삭제 대상 아님).
- **변경 내용**:
  - **T1-1**: WMP-AGL-007(편집)·008(삭제) 신규 항목 + 기능 목록 표 2행 추가.
  - **T1-5**: sprint FSM 다이어그램에 `FUTURE --> [*] : 삭제` 전이 추가 + 편집(상태 무변경)·삭제(FUTURE만) 규칙 명시. 각 상태 비고에 편집·삭제 가능 여부 표기.
  - **T3-2**: API 표에 `PATCH /sprints/{id}`(편집)·`DELETE /sprints/{id}`(삭제) 2행 추가.
  - **T3-3**: §6.1 백로그에 스프린트 …(더보기) 메뉴·EditSprintDialog(기간 프리셋 포함)·ConfirmDialog 항목 추가 + 컴포넌트 매핑 갱신.
  - **BE 구현**: `SprintDtos.UpdateRequest`(name·goal·startDate·endDate) + `SprintService.update`(endDate≥startDate 검증)·`delete`(FUTURE 가드→항목 백로그 복귀→삭제) + `SprintMapper` update/delete 쿼리 + `WorkItemMapper.clearSprintBySprintId`(백로그 복귀) + SprintController PATCH/DELETE + `WmpAuthz.WRITER` 가드 + 에러코드 **WMP-7847**(SPRINT_DELETE_NOT_FUTURE) 신규.
  - **FE 구현**: `agileApi.updateSprint`·`deleteSprint` + `useUpdateSprint`·`useDeleteSprint` 훅 + `EditSprintDialog`(기간 프리셋 Select·종료일 자동계산) + `SprintHeader` …메뉴(DropdownMenu, VIEWER 숨김) + 삭제 ConfirmDialog + `duration.ts`(프리셋→종료일 순수 함수, 단위테스트).
- **스키마 무변경**: sprints 테이블 그대로. 신규 마이그레이션 없음. 에러코드만 WMP-7846 1종 신규.
- **영향 설계서**: T1-1, T1-5, T3-2, T3-3, CR_변경_이력(5종). **T1-3/T1-4/T1-6/T3-1 무변경**(비즈규칙·정책·이벤트·스키마 전부 그대로).
- **테스트(예정)**: SprintServiceTest(편집·삭제 happy + FUTURE 아닌 삭제 거부 + endDate<startDate 거부) + duration 순수 함수 단위테스트. FE tsc -b + vite build.

### CR-036 — 백로그 보기 토글(우선순위순 ↔ Epic별 그룹) + Epic별 고유 색 (CR-022 보완)

- **대상 기능 ID**: WMP-AGL-001(확장)
- **변경 타입**: 신규(FE) + 설계보정 | **영향도**: Low(백로그 화면 — FE 한정, 신규 BE 0)
- **상태**: **설계 캐스케이드 완료(2026-07-04). 구현 착수 대기(사용자 승인 후).**
- **배경**: 사용자 관찰 — 백로그(및 어느 화면이든) Epic을 따로 그룹핑하는 게 없어 "어느 큰 묶음 소속인지" 조망이 헷갈림. Jira가 백로그를 평면 우선순위 큐로 두는 이유(GreenHopper 인수·이슈트래커→애자일 확장의 역사적 흔적 + 스프린트 중심 철학)를 검토한 뒤, **"우리 내부툴은 Jira를 그대로 따를 필요 없이 실무형으로 Epic 그룹핑을 선택 제공한다"**로 사용자 결정. Epic 별도 탭은 안 만듦(하나의 work_item 데이터·여러 관점 컨셉, BIZ-014와 어긋남 — Epic은 모든 화면 관통 관리 축) → 백로그 보기 옵션으로 커버.
- **CR-022와의 관계(뒤집기 아님·확장)**: CR-022는 "**항상 강제되는** Epic 펼침 트리"를 폐기하고 평면 기본을 확정했다. 본 CR은 그 평면 기본을 **유지**(기본 모드=우선순위순)하면서, Epic별 그룹은 **사용자가 토글로 켤 때만** 나타나는 선택 보기로 얹는다. CR-022의 근거 "Jira도 평면"은 이번 대화에서 "역사적 흔적일 뿐 내부툴이 따를 근거는 아님"으로 재평가됨 → 본 CR이 CR-022를 부분 정정(강제 트리 폐기는 유지, 선택 그룹 보기는 허용).
- **핵심 설계 결정(사용자 합의 2026-07-04)**:
  - **보기 토글 2모드**: 우선순위순(기본) ↔ Epic별. 담당자별/상태별은 이번 범위 제외(후속).
  - **Epic별 = 백로그 영역만 그룹핑 재배열**. `epicId`로 묶어 Epic 헤더(색 칩+이름+항목수) 아래 소속 항목, 미소속은 "Epic 미지정" 그룹. **스프린트 구역은 그룹핑 안 함**(스프린트=우선순위 큐 본령).
  - **Epic 헤더 접기/펼치기**(Collapsible, 기본 펼침).
  - **Epic별 고유 색**: `epicId` 안정 해시 → 색 팔레트 선택(같은 Epic=항상 같은 색, Jira식 뚜렷한 색). CR-022의 violet 단색에서 확장. 색은 그룹핑 신호 전용.
- **변경 내용**:
  - **T1-1**: WMP-AGL-001 출력 설명 정정("Epic 그룹 펼침 트리" → "평면 + Epic 소속 칩, CR-036 보기 토글로 Epic별 그룹 선택"). CR-022 폐기가 T1-1에 미반영이던 문서부채 동시 정리.
  - **T3-3**: §6.1 백로그에 "보기 토글(우선순위순↔Epic별)"·"Epic별 고유 색" 항목 추가 + 컴포넌트 매핑에 보기 토글·EpicGroupHeader·고유 색 추가.
  - **FE 구현(예정)**: ① 백로그 상단 보기 토글(ds-ui 세그먼트/토글) ② `BacklogView`에 viewMode 상태 + Epic별 그룹핑 로직(순수 함수, 단위테스트 대상) ③ `EpicGroupHeader`(접기/펼치기) ④ `EpicChip`/그룹 헤더에 epicId 해시 기반 색 매핑 유틸(순수 함수).
- **BE 무변경**: 백로그 응답(`GET /projects/{id}/backlog`)에 `epicId` 이미 포함(구역별 플랫 전체, 페이징 없음). Epic 이름은 `useProjectItems`로 이미 조립 중. 신규 엔드포인트·테이블·에러코드·마이그레이션 없음. work_item 단일 테이블·epicId 느슨연결(BIZ-014) 무변경.
- **영향 설계서**: T1-1, T3-3, CR_변경_이력(3종). **T1-3/T1-4/T1-5/T1-6/T3-1/T3-2 무변경**(비즈규칙·정책·FSM·이벤트·스키마·API 전부 그대로).
- **테스트(예정)**: Epic 그룹핑 순수 함수 + epicId→색 해시 순수 함수 단위테스트. tsc -b + vite build.
- **요청자**: 사용자 | **승인자**: 사용자(2026-07-04, "중규모", "우선순위순↔Epic별 토글", "접기/펼치기", "선택 토글로 보완", "Jira식 뚜렷한 색") | **적용 버전**: v2.3
- **변경 일자**: 2026-07-04

<!-- 변경 요청 추가 시 같은 형식으로 작성 -->

---

## 명명 규칙
- 변경 요청 ID: `CR-[순번]`
- 변경 타입: 신규 | 변경 | 삭제 | 보류 | 설계보정
- 영향도: High(아키텍처/다수 모듈) | Medium(단일 모듈) | Low(단일 기능)
