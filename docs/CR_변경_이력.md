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

<!-- 변경 요청 추가 시 같은 형식으로 작성 -->

---

## 명명 규칙
- 변경 요청 ID: `CR-[순번]`
- 변경 타입: 신규 | 변경 | 삭제 | 보류 | 설계보정
- 영향도: High(아키텍처/다수 모듈) | Medium(단일 모듈) | Low(단일 기능)
