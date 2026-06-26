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

### CR-017 — FE Sprint 5 1차: 회사 홈(§9.2) 막힘 중심 대시보드

- **변경 타입**: 신규 | **영향도**: Low
- **배경**: Sprint 5 진입 1차. `/`(회사 홈)이 StubPage였음. T3-3 §9.2(막힘 중심 대시보드) 이미 v0.4 확정 → **설계 캐스케이드 불필요(구현만)**. BE `DashboardController`(metrics·blocked·delayed·unassigned + `?projectId=` 옵션, 가시성 BIZ-108 BE 처리) 이미 구현·운영(CR-009). 사용자 결정(2026-06-27): **소규모·BE 무변경**. LNB 첫 진입점이라 체감 큼.
- **변경 내용(FE)**:
  - **신규 feature `dashboard`**: `api.ts`(GET `/dashboard/metrics`·`/dashboard/{blocked|delayed|unassigned}` — PageResponse, `?projectId=` 옵션) + `hooks.ts`(`useDashboardMetrics`, `useDashboardList(kind, size)` — 패널은 상위 5건 미리보기).
  - **신규 composite(features/dashboard/components)**: `MetricCard`(SummaryView Metric 톤 일치, 신호색만) · `WorkItemMiniRow`(한 줄 미리보기 — 유형/key/제목/막힘사유/우선순위/기한, 지연=빨강, 클릭→`/work-items/{key}`) · `DashboardListPanel`(상위 N건 + 총건수 배지, 로딩=Skeleton, 빈 상태=인라인 안내).
  - **화면 구현**: `pages/HomePage.tsx`(StubPage→실구현). 상단 지표 카드 5개(진행중·오늘마감·이번주마감·미배정·장기미변경, WMP-HOME-001) + 하단 막힘/지연/미배정 3패널(WMP-HOME-002). 카드 클릭→`/search` 도착지는 SearchPage가 아직 Stub이라 미연결(차기 CR에서 연결).
  - **MSW**: dev 화면 확인용 `/dashboard/*` 4종 핸들러 + 인라인 mock work_items(막힘2·지연2·미배정2). 실 BE엔 work_items 테이블 존재, 미러는 화면 확인 목적.
  - **UI 규칙 준수(CLAUDE.md)**: 색 절제(주의 지표·막힘만 amber/red, 본문 중립), div+border 패널 관용구(SummaryView 일치), 로딩=Skeleton, 네이티브 위젯 0.
- **스키마/BE**: 무변경(기존 대시보드 계약 소비).
- **검증**: `tsc --noEmit` PASS, `pnpm build` PASS, vitest 40/40 PASS(신규 dashboard 계약 5개 포함). 라우트(`/` index)·LNB 연결·런타임 빌드까지 확인. 운영 적용=`./deploy.sh fe`.
- **영향 설계서**: 없음(T3-3 §9.2 그대로 구현).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-27, 소규모·BE 무변경) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-27

### CR-018 — FE Sprint 5 2차: 받은함(§받은함) 알림·멘션·배정 통합

- **변경 타입**: 신규 | **영향도**: Low
- **배경**: Sprint 5 2차. `/inbox`(받은함)가 StubPage였음. T3-3 §받은함 이미 v0.4 확정 → **설계 캐스케이드 불필요(구현만)**. BE `InboxController`(`GET /inbox` = 목록+안읽음 배지 통합, CR-011) + `NotificationController`(`PATCH /notifications/{id}/read`, CR-009) 이미 구현·운영. 사용자 결정(2026-06-27): **소규모·BE 무변경**. LNB 두 번째 진입점.
- **변경 내용(FE)**:
  - **신규 feature `inbox`**: `api.ts`(GET `/inbox`(isRead 필터·페이징, InboxResponse=notifications+unreadCount), PATCH `/notifications/{id}/read`) + `hooks.ts`(`useInbox(filter,page)`, `useMarkRead` — 낙관적 isRead=true·배지-1, 실패 롤백+토스트, 성공/실패 모두 `['inbox']` invalidate).
  - **신규 composite**: `NotificationRow`(유형 아이콘·색 신호 — ASSIGNED=파랑·BLOCKED=빨강·MENTIONED=보라, 안읽음 점+진한 톤, 메시지+시각, 읽음 버튼. 클릭 시 workItemId→단건 조회(`workItemApi.get`)로 key 해소 후 `/work-items/{key}` 이동 — 알림은 workItemId만 보유).
  - **화면 구현**: `pages/InboxPage.tsx`(StubPage→실구현). 헤더 안읽음 배지 + 필터 토글(전체/안읽음) + 알림 목록 + 페이징. 로딩=Skeleton, 빈 상태=EmptyState.
  - **MSW**: `/inbox`·`/notifications/{id}/read`·`/work-items/{id}` 단건(알림 클릭 이동용) 핸들러 + mock 알림 3종(seedInbox, `__resetMockState`에 리셋 추가).
  - **UI 규칙 준수(CLAUDE.md)**: 색 절제(유형 신호만), 로딩=Skeleton, 네이티브 위젯 0, 토글/페이저 관용구 일치(ApprovalsView/ListView).
  - **범위 밖(차기 CR)**: LNB 받은함 메뉴의 안읽음 배지 — AppShell `MENU` 정적 상수 동적화 필요하여 별도 CR. 본 CR은 받은함 화면 내 배지만.
- **스키마/BE**: 무변경(기존 받은함·알림 계약 소비).
- **검증**: `tsc --noEmit` PASS, `pnpm build` PASS, vitest 45/45 PASS(신규 inbox 계약 5개 포함). 라우트(`/inbox`)·LNB 연결·런타임 빌드 확인. 운영 적용=`./deploy.sh fe`.
- **영향 설계서**: 없음(T3-3 §받은함 그대로 구현).
- **요청자**: 사용자 | **승인자**: 사용자(2026-06-27, 소규모·BE 무변경·승인 생략 진행) | **적용 버전**: v2.0
- **변경 일자**: 2026-06-27

<!-- 변경 요청 추가 시 같은 형식으로 작성 -->

---

## 명명 규칙
- 변경 요청 ID: `CR-[순번]`
- 변경 타입: 신규 | 변경 | 삭제 | 보류 | 설계보정
- 영향도: High(아키텍처/다수 모듈) | Medium(단일 모듈) | Low(단일 기능)
