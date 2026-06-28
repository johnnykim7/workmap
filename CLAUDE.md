@AI-SDLC_공통라이브러리_레퍼런스.md
# ↑ bp-common-lib 레퍼런스. 구현 세션 시작 전 bp-common-lib 레포에서 최신본을 복사해 둘 것.

# 프로젝트 개요

WorkMap (업무지도) — 당사 내부의 개발·운영·고객사 대응·반복업무·경영공통 업무를 하나의 Task 구조로 관리하고, WBS·칸반·타임라인·이슈·리스크·회사홈으로 연결해 업무 누락과 지연을 줄이는 내부 업무운영 시스템.
프로젝트 유형: **풀스택 (Spring Boot + React)**
프로젝트 코드: **WMP** · 패키지 루트: `com.therecommerce.workmap`

## 핵심 컨셉

**하나의 Task 데이터, 여러 관점.** 이슈·리스크·WBS 항목·칸반 카드·타임라인 항목은 별도 테이블이 아니라 Task의 파생 뷰다(T1-3 BIZ-014/015).

## 기술 스택

### 백엔드
- 프레임워크: Spring Boot 3.x + Java 17
- DB: **PostgreSQL 16.x** (WorkMap 결정) / 마이그레이션: Flyway
- 영속성: **MyBatis** (⚠️ JPA/Hibernate 일절 금지 — 조직 표준)
- 인증: JWT + Refresh (bp-common-lib `JwtTokenProvider` 상속)
- 공통: bp-common-lib 0.1.0 (응답/예외/페이징/검색/멱등 — 직접 구현 금지)
- 이벤트(Phase1): Spring ApplicationEvent (인프로세스)
- 빌드: Gradle (Kotlin DSL)

### 프론트엔드
- 프레임워크: React 19 + Vite + TypeScript
- UI: @therecommerce/ds-ui (shadcn 기반) + Tailwind v4
- 서버상태: TanStack Query / 클라이언트상태: Zustand
- 라우팅: React Router v6 / 폼: React Hook Form + Zod
- 패키지 매니저: pnpm

## BE 아키텍처 규칙
- 패키지: `com.therecommerce.workmap.{domain}.{controller|service|mapper|dto|domain}`
- 로직은 **Service에만** (Controller는 위임만)
- 응답은 bp-common-lib `ResponseDto<T>` 래퍼 사용 (직접 정의 금지)
- 에러는 `BusinessException` + `ErrorCode` 구현체(**7700번대**)
- 페이징은 `PageRequest`/`PageResponse` 사용
- MyBatis 매퍼: `resources/mapper/{Domain}Mapper.xml` + 인터페이스 `@Mapper`
- **JPA 어노테이션·Repository·Auditing 사용 금지**
- 상태 전이는 반드시 FSM 가드(T1-5 화이트리스트) 경유. 직접 status UPDATE 금지.

## FE 아키텍처 규칙
- 구조: `features/{도메인}/` (api·hooks·components·types), 공용 `components/`, `lib/`
- 서버 데이터는 TanStack Query, 전역 UI/인증은 Zustand
- **ds-ui 컴포넌트 사용 필수 — 윈도우/브라우저 네이티브 UI 절대 금지.**
  - **금지(예외 없음)**: `alert()` / `confirm()` / `prompt()`, 네이티브 `<select>` / `<input type=checkbox|radio|date|file>` / `<dialog>` 직접 사용, `window.alert` 등 브라우저 기본 위젯.
  - **대체**: 확인창 → ds-ui `Dialog`/`AlertDialog`, 선택 → `Select`/`Combobox`, 체크박스/라디오 → ds-ui `Checkbox`/`RadioGroup`, 날짜 → `DatePicker`/`Calendar`, 토글 → `Switch`, 알림/토스트 → ds-ui `Toast`(브라우저 alert 금지). 파일 업로드도 ds-ui 래퍼 또는 스타일링된 컴포넌트로.
  - ds-ui에 없는 것만 자체 제작하되, **ds-ui base + Tailwind 토큰으로 조립**(네이티브 위젯 노출 금지). 업무 도메인 composite(WorkItemCard/KanbanBoard/BacklogRow/SprintHeader/StatusBadge/TypeBadge/MeasureBar/SplitView/CreateModal/ProjectCreateWizard 등)가 자체 제작 대상.
- **레이아웃·색상 절제(과한 알록달록 금지)**: 화면은 차분하게. 색은 **의미 전달용으로만 최소** 사용 — 상태/우선순위/막힘 같은 **신호에만** 색(StatusBadge·PriorityBadge), 본문·레이아웃은 중립 톤(ds-ui 기본 토큰, 회색·흰색 기반). 한 화면에 강조색 남발 금지. 색은 ds-ui Tailwind 테마 토큰만 쓰고 임의 hex 지양.
- **버튼 일관성(같은 유형 = 같은 색·같은 레이아웃)**: 액션 유형별로 ds-ui Button `variant`를 고정해 전 화면 통일.
  - **생성/추가/저장(주요 액션)** = `primary` (한 화면에 보통 1개) · **수정/편집** = `secondary`(또는 outline) · **삭제/취소(파괴/이탈)** = 삭제는 `destructive`(빨강), 취소는 `ghost`/`outline` · **보조 액션** = `ghost`.
  - 같은 의미 버튼은 위치·크기·아이콘도 통일(예: 삭제는 항상 우측, 같은 휴지통 아이콘). 같은 액션에 화면마다 다른 색·다른 variant 쓰지 말 것.
  - 이 매핑은 공통 래퍼/상수로 두어 한 곳에서 관리(개별 화면에서 색 직접 지정 금지).
- **반복 UI 패턴은 전 화면 일관(공통 컴포넌트로 한 번만 만들고 재사용)**: 같은 종류 UI를 화면마다 다르게 만들지 말 것. 아래는 모두 ds-ui 기반 공통 컴포넌트/래퍼로 통일.
  - **경고/정보/성공/에러 메시지**: 의미별 색·아이콘 고정 — info=중립/파랑, success=초록, warning=노랑, error/danger=빨강. 인라인 알림은 ds-ui `Alert`(variant 고정), 일시 알림은 `Toast`. 같은 의미는 전 화면 같은 색·아이콘·문구 톤. (네이티브 alert 금지 — 위 규칙)
  - **검색**: 검색 입력은 ds-ui `SearchInput` 하나로 통일(같은 아이콘·placeholder 톤·동작). 목록 필터/퀵필터(§13.9)도 공통 FilterBar/QuickFilterBar로 — 화면마다 다른 검색 UI 금지.
  - **빈 상태(Empty State)**: "데이터 없음"은 공통 EmptyState 컴포넌트(아이콘+안내문+주요 액션) — 화면마다 제각각 금지.
  - **확인/삭제 다이얼로그**: 파괴적 액션 확인은 공통 ConfirmDialog 하나로(제목·경고문·destructive 버튼 일관).
  - **폼**: 라벨·에러 표시·필수(*) 표기·도움말 위치를 공통 Field 래퍼로 통일(React Hook Form + Zod). 같은 폼 패턴 반복.
  - **페이징·정렬·테이블**: ds-ui Pagination/Table 공통 사용, 컬럼·정렬·행 클릭 동작 톤 통일.
- 칸반 상태 변경은 낙관적 업데이트 + 서버 권위 롤백(T1-5 UI FSM)
- 폼 검증: Zod 스키마 → React Hook Form
- **로딩 = 스켈레톤 필수(공통)**: 서버 데이터 패칭 화면/영역은 빈 화면·스피너 대신 ds-ui `Skeleton`으로 placeholder 표시(실제 콘텐츠와 같은 레이아웃 골격). 스피너는 버튼/인라인 등 작은 부분 로딩만. 상세 규약·화면별 형태는 T3-3 "공통 UX 규약 — 로딩 스켈레톤".

## 네이밍 규칙
- 엔티티(Java): PascalCase / 테이블: snake_case
- API 경로: kebab-case, 복수 명사 / 변수: camelCase
- FE: 파일 kebab-case, 컴포넌트 PascalCase, 변수 camelCase
- 기능 ID: WMP-{모듈}-{순번} / 규칙 BIZ-/정책 POL-/변경 CR-

## 핵심 비즈니스 규칙 (T1-3 전문 참조)
- BIZ-001: 모든 Task는 업무영역 필수
- BIZ-002: 모든 Task는 담당자 필수
- BIZ-005: BLOCKED 전이 시 차단 사유 필수
- BIZ-006: DONE 전이 시 completed_at 자동
- BIZ-009: 삭제는 소프트 삭제(deleted_at)
- BIZ-010: 상태 전이는 FSM 화이트리스트만
- BIZ-014: 이슈 = task_type이 버그/장애/요청/개선인 Task (별도 테이블 금지)

## 테스트 전략

> 개별 테스트 케이스는 docs/T3-5_단위테스트_명세.md 참조.

### 테스트 범위
| 레이어 | 필수 | 대상 | 패턴 |
|--------|------|------|------|
| Service | 필수 | 비즈니스 로직, FSM 전이 | {Name}ServiceTest.java |
| Mapper | 선택 | 복잡 쿼리(통합목록 필터)만 | {Name}MapperTest.java |
| Controller | 조건부 필수 | 생성(POST) Happy Path 필수 | {Name}ControllerTest.java |
| Store/Hook (FE) | 필수 | 상태 변경, 재사용 로직 | *.test.ts |
| Component (FE) | 선택 | 칸반 드래그 등 주요 인터랙션 | *.test.tsx |

### 모킹 전략
- 외부 API: 전부 Mock
- DB: 테스트용 PostgreSQL(Testcontainers) 또는 Mapper Mock
- 이벤트: ApplicationEvent 발행 검증(Mock 리스너)
- 시간 의존(지연·장기미변경): Clock Mock
- FE API: MSW로 응답 시뮬레이션

### 테스트 작성 원칙
- 이름: "상황_행동_기대결과" (예: BLOCKED전이_사유없음_거부됨)
- FSM 전이: 허용 + 금지 전이 모두 검증
- 이벤트: 발행 여부 + 페이로드 검증
- Controller 생성 테스트: 엔티티별 POST 최소 1건(DTO 검증·ID 정합)
- FE-BE 계약 테스트: API client 경로·필드·타입이 BE와 일치하는지 검증

## Git 브랜치 전략
| 브랜치 | 역할 | 보호 |
|--------|------|------|
| `main` | 운영 배포 가능 | PR 머지만 |
| `develop` | 개발 통합 | PR 권장 |
| `feat/SPR-{N}-{기능}` | Sprint 작업 | develop에 PR |

- 흐름: `feat/SPR-01-setup` → develop(PR) → main(릴리스 PR)+tag
- 커밋: `<type>: <설명>` (feat/fix/refactor/docs/chore/ui)

## 현재 진행 상태
- **설계: v0.4(Jira 애자일) 전면 개정 완료 (2026-06-23, CR-006).** ClickUp(v0.3) → Jira 전환. T1~T3 + execution-spec 모두 v0.4 기준.
- **구현 진척**: Sprint 1(세팅)·2(인증·WS·프로젝트·멤버, CR-007)·3(work_item 코어)·4(애자일·운영 실행 BE, CR-008)·5(회사홈/보고·관리자 마스터·알림 수신 BE, CR-009)·P2 BE(링크·타임라인/캘린더·업무유형·양식빌더, CR-010)·**설계 잔여 BE 3종(프로젝트 수정·보관 + 받은함, CR-011) 완료 → Phase 1 + P2 BE 100% 완료.**
  - Sprint 4 BE 신규 모듈: `agile`(스프린트 FSM·백로그), `board`(보드), `ops`(처리량·백로그전환), `approval`(승인 게이트) + work_item 통합목록·벌크편집. 승인 게이트는 사용자 결정(2026-06-26)으로 Sprint 4 포함.
  - Sprint 5 BE 신규 모듈: `dashboard`(막힘/지연/미배정·지표·프로젝트보고서, 가시성 BIZ-108 필터 + `?projectId=` 옵션), `admin`(측정단위/필드스킴/워크플로 CRUD, `@PreAuthorize` OWNER/ADMIN) + `notification` 수신 조회(GET/PATCH read). 발행은 Sprint 3 기존.
  - **P2 BE 신규(CR-010)**: F1 링크 전체 API(`work-items/{id}/links` GET/POST/DELETE, 양방향 자동 BIZ-109) + `view` 모듈(`projects/{id}/timeline·calendar`, 가시성 가드=대시보드와 동일) + admin 확장 `issue-types`(WMP-ADM-004, 시스템 5종 보호) + `forms` CRUD+제출(WMP-ADM-005, `forms/{id}/submit`은 인증사용자 누구나, WorkItemService.create 위임). 에러코드 7790번대 9종 신규. 스키마 무변경(work_item_links/issue_type/forms 기존).
  - **CR-011 잔여 BE 3종**: `PATCH /projects/{id}`(부분수정 — name/active_tabs/기간/설명, `<set>` 동적 XML, Manager 가드) + `PATCH /projects/{id}/archive`(소프트 보관, FSM 가드 경유 — PLANNING→ARCHIVED 거부) + `GET /inbox`(받은함 = 알림 목록 + 안읽음 배지 통합, NotificationService 재사용 별칭). 신규 매퍼 없음·스키마 무변경·에러코드 신규 없음(기존 재사용). Project 도메인에 `@NoArgsConstructor @AllArgsConstructor` 보강.
  - **CR-012 Phase 2 잔여 BE 3종(2026-06-27 완료, 중규모)**: `burndown`(WMP-AGL-006 — `GET /sprints/{id}/burndown`·`GET /projects/{id}/velocity` + **burndown_snapshots 신규 테이블 V3** + 이벤트 리스너(`SprintStarted→START`·`SprintCompleted→COMPLETE`, `@TransactionalEventListener AFTER_COMMIT`+`@Async`) + 일별 스케줄러(`@Scheduled` cron, `@EnableScheduling`)) + `ops` 현장검증(WMP-OPS-004 — `GET·POST /work-items/{id}/field-verifications`, 발견이슈→후속 BUG 생성+양방향 RELATES_TO, 상태전이는 별도 FSM 경유) + `view` 저장필터(WMP-VIEW-004 — `saved-filters` CRUD, query JSONB 패스스루, 수정·삭제 소유자 가드). 에러코드 WMP-7798~7802. 단위테스트 148/148 PASS. **운영 E2E(deploy.sh be) 완료** — 이벤트→스냅샷 적재·벨로시티·후속업무 생성·소유자 가드 전부 운영 검증.
    - **CR-012 중 발견·수정**: docker-compose.prod.yml `DB_URL`에 `?stringtype=unspecified` 누락(기존 인프라 버그) → active_tabs/saved_filters.query JSONB insert 운영 500. 수정+재배포 완료(커밋 1f36bb8).
  - 단위테스트 전체 `./gradlew test` PASS(148/148 — CR-011 8개 + CR-012 18개 포함). **런타임 E2E 완료**: CR-011(inbox·PATCH·archive) + CR-012(번다운/현장검증/저장필터 운영 8186). CR-010 E2E는 여전히 미수행.
- **FE 진척**: Sprint 4(백로그/보드/벌크편집)·Sprint 5(회사홈·받은함·승인·목록·**검색**·**관리자 3종·보고서**)·**P2 타임라인/캘린더 화면 2종 구현 완료**(`features/view/` api·hooks·TimelineChart·CalendarGrid + StubPage 교체, T3-3 화면 상세화, 유틸 단위테스트 22개 PASS). Phase2 화면 실행이므로 CR 미부여.
  - **Sprint5 잔여 FE 4종(2026-06-27, 커밋 675d6d3)**: `features/admin/`(api·hooks·AdminTabs·다이얼로그 4종) + 관리자 3화면 실구현 — 측정단위(WMP-ADM-001 CRUD·시스템가드)·필드스킴(WMP-ADM-002 projectId/issueTypeCode 필터·노출/필수)·워크플로(WMP-ADM-003 좌목록+우 상태/전이 master-detail·시스템 읽기전용) + 보고서탭(WMP-HOME-003 `GET /projects/{id}/report` — 요약·진행률·상태/유형/담당자 분포, dashboard feature에 report api/hooks·DistributionBars 추가). admin api.test.ts 9개 PASS(fetch 스텁). tsc -b + vite build 통과. **레포 공통 jsdom ERR_REQUIRE_ESM(기존 테스트 전부 동일 실패)로 jsdom 환경 vitest 불가 — admin 테스트는 DOM 무의존이라 node 환경 9/9 PASS로 확인.**
  - **검색(§13.9, 2026-06-27)**: `features/search/` + SearchPage 실구현(전사 검색·필터·퀵필터·표·페이징). 회사홈 카드→`/search?quick=` 연결. **CR-017**(검색 keyword 범위 확장 — 설명·댓글 ILIKE+EXISTS, mapper `searchWhere` 보정. §13.9가 요구하나 BE 미달이라 계획 외 보정으로 CR 부여). 운영 배포·SQL 직접검증 완료(설명/댓글 매칭 OK, ROLLBACK).
  - **P2 잔여 FE(2026-06-27, 커밋 85e795d)**: 링크는 기존 `LinkedItems`로 이미 구현되어 제외, 나머지 4종 신규 — ① 양식빌더(WMP-ADM-005, `/admin/forms` 라우트·AdminTabs 탭 신규 + features/admin forms api/hooks·FormDialog(JSONB fields 편집)·FormSubmitDialog) ② 번다운/벨로시티(WMP-AGL-006, `features/burndown` api/hooks + SVG BurndownChart·CSS VelocityChart, 보고서탭 하단에 스프린트 선택+차트) ③ 현장검증(WMP-OPS-004, `features/ops` api/hooks + FieldVerifications 섹션, 업무상세 패널에 운영형 상태일 때만 노출, 발견이슈→후속업무 옵션) ④ 저장필터(WMP-VIEW-004, `features/saved-filter` api/hooks·SavedFilterBar·filter-codec, SearchPage 통합). 진입 위치는 T3-3 화면구조 기준 배치. saved-filter/api.test.ts 8개 + admin 9개 = 17/17 PASS(node 환경, fetch 스텁). tsc -b + vite build 통과(3389 modules). 계획된 P2 실행이므로 CR 미부여.
  - **미연결 BE 3종 FE 연결(2026-06-27, 커밋 904c246)**: BE에는 있으나 FE 화면이 없던 3종 연결 — ① 업무유형 마스터(WMP-ADM-004, `/admin/issue-types` 라우트·AdminTabs '업무 유형' 탭 + features/admin issueTypes api/hooks·IssueTypeDialog, code 수정잠금·시스템유형 가드) ② 처리량(WMP-OPS-002, features/ops throughput api/hook, 보고서 탭에 담당자별 완료건수 DistributionBars 위젯) ③ 백로그 전환(WMP-OPS-003, promote-to-backlog api/hook + PromoteToBacklog 섹션, 업무상세 운영형 상태일 때 노출, 원본↔신규 RELATES_TO). api.test.ts 6개 추가(22/22 PASS). tsc+build 통과. 운영 배포·검증 완료(index-B3Z-ovVm.js·신규 엔드포인트 403 확인). CR 미부여(계획 기능 실행).
  - **FE 미연결 4종 연결(2026-06-27, 중규모)**: 위 "BE 엔드포인트 전부 FE 연결 완료" 표기가 실제와 어긋났음을 E2E #7에서 발견 → 핵심 4종이 미연결이었음. BE는 이미 있고 FE 진입점·호출만 없던 상태(BE 계약 코드 실측 후 맞춤, 신규 BE 0). ① **WMP-WI-001 업무 생성** — create-modal stub → 실제 생성 폼(`POST /work-items`, §9.4 가볍게: 필수 프로젝트·유형·요약 + 선택 설명·담당자·우선순위·라벨·Epic, 유형은 템플릿 issueTypeCodes로 좁힘, 연속생성). `workitem/api.ts` create + `hooks.ts` useCreateWorkItem. ② **WMP-WS-001 워크스페이스 생성/수정** — `POST·PATCH /workspaces`(Admin/Owner) + WorkspaceDialog, ProjectsPage 헤더/필터바 진입. ③ **WMP-WS-004 프로젝트 수정/보관** — `PATCH /projects/{id}`·`/archive`(Manager+) + ProjectSettingsDialog(이름·기간·설명·탭 + 보관 destructive+ConfirmDialog). ④ **WMP-WS-006 가시성** — `PATCH /projects/{id}/visibility` + 설정 다이얼로그 공개/비공개 Switch. 진입: 전역 만들기 모달 / ProjectCard 우상단 메뉴 / SummaryView 설정 버튼. ds-ui만(네이티브 alert/confirm/select/date 없음), 버튼 variant 규칙 준수. **4종 모두 T3-2/T3-3에 이미 설계 완료 — 신규 설계 항목 없어 문서 변경 불요(설계-구현 일치 확인).** wmp-unconnected.test.ts 8/8 PASS(node 환경 fetch 스텁), tsc -b + vite build(3400 modules) 통과. E2E #7 ✅. CR 미부여(설계된 미연결 연결=실행). **운영 배포·화면 E2E는 미수행(다음 작업).**
  - **CR-024 설명란 리치 에디터 + 파일 업로드(2026-06-28, 중규모, 운영배포·E2E 완료)**: UX#17 "설명란 에디터화" — 직전 "과함" 결론 철회(설계 T3-3은 이미 리치에디터로 정의돼 있었고 구현이 plain Textarea로 미달이었음). 실측: 만들기 모달=상세 설명은 같은 1필드(description). **BE 신규 `file` 모듈**: `POST /api/v1/files/upload`(multipart→URL)·`GET /api/v1/files/serve/{name}`(정적 서빙, 화이트리스트 공개) + `FileStorageService`(로컬 디스크, UUID 파일명, 타입 화이트리스트 image 4종, traversal 가드) + `UploadProperties`(`workmap.upload.*` 설정값 조정) + multipart 10MB + WmpErrorCode **7809~7813**(초안 7803~5는 WS/탭 점유로 정정). 화이트리스트는 `/files/serve/*`만(img src 무인증), 업로드 POST는 인증 유지(경로 분리). **FE**: 공용 `RichTextEditor`(Tiptap, 색 절제 — 굵게/기울임/밑줄/제목/목록/링크/코드/인용/이미지) + create-modal·DetailBody 설명란 교체(Controller/blur commit) + `lib/upload.ts`·api-client.upload + `lib/html-text.ts`(미리보기 strip). 저장형식=HTML 문자열(description text 컬럼 무변경), 이미지=별도 파일 URL만 삽입. **운영 함정**: BE가 docker 컨테이너라 uploads가 휘발 → docker-compose.prod.yml에 호스트 볼륨 바인드 마운트 추가(`/home/therecommerce/workmap/uploads` 동일경로, 777 권한). 에디터=Tiptap은 조직 일관성(axopm IssueEditor 동형). FileStorageServiceTest 7개·html-text 7개 PASS, FE 36/36, tsc+build(3467 modules). **운영 E2E 완료(BE)**: 인증 업로드→URL 반환→무인증 서빙 200/image/png, PDF 거부(7810), 업로드 무인증 403, 호스트 디스크 실제 저장 확인. 커밋 071d962·959d8c3 push.
    - **⚠️ LNB 사라짐 사고·해결(2026-06-28, 커밋 606d792)**: tiptap 배포 직후 운영에서 **ds-ui 사이드바(LNB)가 통째로 사라짐**(본문 정상·콘솔 에러 없음). 근본 원인=Tailwind v4 유틸 정렬이 tiptap 추가로 흔들려 `.hidden`이 `@media .md:block` 뒤로 밀림 → 사이드바 `hidden md:block`에서 숨김이 이김(데스크탑 1376·isMobile=false인데 display:none). 진단 삽질 3회(인라인 [&_.tiptap]셀렉터 제거→실패, 별도 .css @layer 이동→실패, [data-slot=sidebar]만 override→영역만 생기고 빈 채). 해결=main.css 최하단 `@media(min-width:768px){.hidden.md\:block{display:block!important}.hidden.md\:flex{display:flex!important}}`로 ds-ui 사이드바 전 레이어 고정. 1차 롤백(서비스 복구)→원인 격리→재구현→배포·시크릿 확인 완료. **상세·교훈: 메모리 [[workmap-tailwind-lnb-trap]].** RichTextEditor 콘텐츠 스타일도 인라인 임의셀렉터→main.css @layer components의 .tiptap 스코프로 이전.
  - **CR-025 Jira 스크럼 정합 보정 3종(2026-06-28, 소규모, 커밋 fdf1816)**: 블로그(velog @jinuku) Jira 스크럼 동작 vs 코드 실측 → 미달 3종 보정. ① **착수일 자동** — IN_PROGRESS 최초 진입 시 `start_date`가 비어있으면 오늘로(WorkItemService.changeStatus, 이미 값 있으면 유지). updateStatus 쿼리에 start_date 컬럼이 없어 함께 보강(없으면 set해도 DB 미반영). ② **라벨 필터** — labels(JSONB 배열) 필터 부재였음 → SearchCriteria/SearchParams/QueryService에 `label` + Mapper searchWhere `labels @> jsonb_build_array(#{label})` + FE SearchPage 라벨 SearchInput·search/api·filter-codec(저장필터). ③ **DOC(문서) 유형** — 블로그 6번째 유형. **IssueType enum에 DOC(1) 추가 필수**(없으면 parseIssueType이 INVALID_REQUEST로 생성 차단 — 시드만으론 불충분) + canBeSubtaskParent에서 DOC 제외(Sub-task 부모 불가) + **V7__doc_issue_type.sql**(issue_type DOC 시드 + 시스템 템플릿 issue_type_codes 편입) + FE domain.ts/badges.tsx(DOC=amber·FileText). 유형 체계 EPIC/STORY/TASK/BUG/DOC/SUBTASK 6종. **BE 신규 엔드포인트·에러코드 0, 스키마 무변경(시드 V7만).** 플래닝 포커·Git 연동은 제품 범위 밖 제외. WorkItemServiceTest 신규 4건(FSM-13/14·HRC-7/8) gradlew test PASS, FE tsc+build(3467 modules) 통과. **운영 배포 미수행(다음 작업) — V7 마이그레이션이라 deploy.sh be 시 Flyway 자동 적용.**
- **CR-026 커뮤니케이션(채팅) 모듈 신규(2026-06-29, 대규모, axopm comm 포팅)**: 워크스페이스 단위 Slack형 채팅 — 채널·메시지·스레드답글·리액션·멘션·첨부·읽음커서·북마크·핀·채널멤버·알림설정(타이핑 제외, 실시간=폴링 5초). axopm은 JPA/UUID/MySQL이라 **MyBatis/BIGINT/PostgreSQL로 재구현** + 기존 자산(Tiptap·FileStorage·인증) 재활용. **DB V8__chat_module.sql(11테이블)** + 에러코드 **WMP-7820~7828** + BE(도메인11·매퍼10·서비스6·컨트롤러4) + FE(`features/chat`·`ChatPage` 3패널·LNB '메시지'·`/chat` 라우트, ds-ui만). BE↔FE 경로 16종 전수 일치. **CR-009 함정 재현**: chat 매퍼 10종을 Project/User/WorkItem `@WebMvcTest` `@MockBean`에 추가. **BE 173/173 PASS·FE tsc+build(3479 modules) 통과.** 설계 캐스케이드는 사용자 B 결정으로 생략(사후 역생성 여지). 미구현=멘션 자동완성/알림연동·첨부 업로드 배선·STOMP.
- **CR-027 이메일 초대 가입 + 비밀번호 재설정/변경(인증번호 OTP) — 설계+구현+BE 운영배포·E2E 완료(2026-06-29, 대규모, 커밋 e598eaa·버그픽스 추가)**: 사용자 지시 "회원가입 시 초대 이메일→링크 진입→비밀번호 설정, 변경도 같은 메커니즘, 이메일은 bp-notification 소비앱 등록".
  - **BE 운영 배포·E2E 완료**: deploy.sh be(V9 Flyway success·invitations/email_otp 생성 확인) + 서버 `.env`에 `WMP_NOTI_API_KEY` 추가(빈 .env였음, docker-compose env_file 참조). E2E 전부 통과 — admin 초대→**bp-notification 실발송 OK**(로그 `WMP_INVITE_OTP`)·email_otp 해시저장·forgot 미존재이메일 200+발송스킵(계정열거방지)·초대 무인증 403·잘못된 코드 WMP-7835.
  - **⚠️ 운영 E2E에서 보안 버그 발견·수정·재검증**: `OtpService.verifyAndConsume`가 `@Transactional`인데 불일치 시 incrementAttempt 후 BusinessException→**트랜잭션 롤백으로 시도횟수 증가가 취소**(attempt_count=0 유지)→인증번호 brute-force 가능. 단위테스트는 Mock이라 롤백 없어 통과했던 한계. **수정**: `OtpAttemptRecorder(@Transactional REQUIRES_NEW)` 별도 빈으로 increment/consume 독립 커밋(self-invocation은 프록시 미경유라 별도 빈 필수). 성공 markConsumed는 메인 트랜잭션 유지. 재배포 후 운영 재검증 — 불일치 시 attempt_count 1→2→…5 증가, 5회째 폐기(consumed)·6회째 7833 차단 확인. **단위테스트 205/205 PASS**(OTP-8 추가).
  - **FE 운영 배포 = CR-028에 동행**(사용자 결정 2026-06-29): CR-027 FE는 커밋 완료(빌드 통과 시점)했으나, 배포 시점 working tree에 다른 세션의 chat MessagePane 미완성 변경이 섞여 `pnpm build` 깨짐 → 단독 배포 보류. CR-028 세션이 chat·알림 완성 후 FE 배포할 때 함께 나간다. **CR-028이 이미 NotificationClient 공유·확장 시작**(`/messages/push`·`/fcm/token` 추가, WMP-NOTI-004 병기 — execution-spec §CR-028 (B)대로). **결정**: ① 초대=`invitations` 테이블만, user는 수락(인증번호+비번설정) 시점 생성(users 스키마 무변경·password_hash 불변식 보존) ② 본인확인=이메일 6자리 **인증번호(OTP) 전면 통일**(초대/forgot/변경) ③ 변경=현재PW+인증번호 **2차 인증** ④ OTP 정책 POL-013(만료10분·시도5·쿨다운60s·1회용·해시저장) ⑤ forgot 계정열거 방지 ⑥ bp-notification에 solutionCode `WMP` 솔루션 등록 후 `POST /messages/email`로 발송(템플릿 3종, best-effort). **사전작업 완료**: bp-notification에 WMP 솔루션(id=10) + OTP템플릿 3종(WMP_INVITE/RESET/CHANGE_OTP) 등록, apiKey 발급 → 메모리 [[workmap-bp-notification]]에 보관(운영 env `WMP_NOTI_API_KEY`로 주입, 소스 미커밋). ⚠️솔루션 등록 시 campaign필드 명시 안 하면 bp-notification 500. **BE**: V9(invitations·email_otp)·에러코드 WMP-7829~7838·invitation 모듈(OtpService·InvitationService·PasswordService·NotificationClient)·AuthController 5종·InvitationController(Admin)·SecurityWhitelist 공개경로 3·UserMapper.updatePassword·@WebMvcTest 3슬라이스 MockBean 보강. **BE 192/192 PASS**(신규 19). **FE**: features/auth 확장·features/invitation·공개라우트 /invite/accept·/password/forgot + 인증 /account/password 3화면·로그인 forgot링크·UsersPage 초대버튼+대기초대목록·계정메뉴 비번변경. **tsc+build 통과, api계약 9/9 PASS**. **설계 갱신 완료**(T1-1·T1-4·T1-6·T3-1·T3-2·T3-3·execution-spec·CR_변경_이력, 커밋 c641756). **⚠️ CR-028(알림 게이트웨이) 동시 진행** — bp-notification·NotificationClient·application.yml 공유. CR-028은 CR-027 커밋 후 NotificationClient에 push/fcm 추가·공용 이전 예정(execution-spec §CR-028 (B) 참조).
- **CR-028 각종 알림 확장 — 설계+구현 (A)그룹 완료, 외부연동 (B)·운영배포 대기(2026-06-29, 대규모)**: 기존 알림(배정·막힘·멘션 3종·인앱 받은함)을 ① **트리거 발행 구현**(댓글·상태변경·마감임박/초과·스프린트시작/완료·승인요청/처리) ② **외부 전달**(이메일/푸시, bp-notification) ③ **사용자 수신 설정**(종류×채널 on/off)으로 확장. T1-6에 마감/스프린트/승인 이벤트는 **계약만 선정의**돼 있던 것을 발행 구현. **결정**: 알림종류 전체 / 기본값 인앱 ON·외부 OFF(sparse) / 외부=bp-notification 활용 / CR-027과 별도 CR / 마감=스케줄러. **설계 캐스케이드 완료**(T1-1·T1-4·T1-6·T3-1·T3-2·T3-3·execution-spec·CR_변경_이력, 커밋 2504f37). **BE (A)그룹**: NotificationType enum 11종 + **V10**(notification_preferences·fcm_tokens) + `NotificationDispatcher`(단일 진입점 — 인앱 항상 기록→설정 확인→외부 fan-out) + `NotificationGateway` 인터페이스(현재 NoopGateway, (B)에서 bp-notification 어댑터로 교체) + NotificationEventListener 7종(배정·막힘·멘션 개편 + 댓글·상태·스프린트·승인 신규, **본인 액션 자기알림 방지**) + WorkItemCommented 이벤트·CommentService 발행 + 마감 스케줄러(매일 09:00 KST, 당일 중복방지) + 수신설정/FCM 컨트롤러·서비스 + **승인 알림 역할→멤버 해소**(approverRole 멤버 fan-out, ProjectMemberMapper.findUserIdsByProjectAndRole) + 에러코드 **WMP-7839·7840**(NOTIFICATION_NOT_FOUND/FORBIDDEN은 기존 7760/7761 재사용). ⚠️ 7839/7840이 동시 진행 CR-027 커밋(e598eaa)에 섞여 들어감(코드 정상·이력만 부정확, 되돌리지 않음). **BE 204/204 PASS**. **FE (A)그룹**: `features/notification-pref`(api·hooks) + `/account/notifications` 매트릭스 화면(행=종류·열=인앱/이메일/푸시 Switch, 변경분만 저장) + 받은함 [알림 설정] 진입 + NotificationRow 신규 종류 아이콘 + api-client.delete body 지원. **api계약 4/4 PASS, tsc+vite 빌드 통과**. **B그룹(외부 전달, 2026-06-29 완료)**: NotificationClient(CR-027)에 `sendPush`·`registerFcmToken`·`deleteFcmToken` 추가(공용 이전 대신 cross-package 주입 재사용 — 동일 솔루션·apiKey·RestClient, 중복 클라이언트 없음) + `BpNotificationGateway`(NotificationGateway 구현, recipientId→이메일 해소 UserMapper, 템플릿코드 `WMP_NOTI_{TYPE}`) → 빈 등록으로 NoopGateway 자동 대체(@ConditionalOnMissingBean) + FcmTokenService가 register/delete 시 bp-notification 미러 위임(best-effort). application.yml `workmap.notification.*`은 **CR-027이 이미 설정** — 재사용(추가 0). BpNotificationGatewayTest 4개 + **전체 209/209 PASS**. **푸시(웹푸시)는 보류** — Firebase 프로젝트·VAPID·Service Worker 인프라 미보유(사용자 확인). BE 푸시 발송 경로(bp-notification userId 기반)는 준비됨, FE 알림설정 푸시 열은 **비활성(준비 중)** 표시. Firebase 준비되면 FE SW·권한요청·토큰등록만 연결하면 됨. **미완**: bp-notification 알림 템플릿(WMP_NOTI_*) 등록(운영 배포 전 필요 — 미등록 종류는 best-effort 무시되고 인앱만), 웹푸시 FE 배선, 운영 배포(V10 Flyway는 deploy.sh be 자동). **에러코드/이력 사고**: 7839/7840이 CR-027 커밋(e598eaa)에 섞임(코드 정상·이력만 부정확). AppShell.tsx·rich-text-editor.css·chat 파일은 CR-028 무관(커밋 제외).
- **운영 적용 완료(2026-06-29, BE)**: ① bp-notification에 알림 이메일 템플릿 **WMP_NOTI_* 11종 등록**(solutionId=10, id 54~64, 본문 `{{message}}`=인앱 문구·제목 종류별). Dispatcher가 외부 fan-out 시 인앱 message·workItemId를 variables에 자동 포함하도록 보정(커밋 5633b6e — 리스너가 4인자 dispatch 호출이라 변수가 userName뿐이던 것 보완). ② **deploy.sh be 운영 배포** — V10 Flyway 적용 성공(flyway_schema_history v10 success=true, notification_preferences·fcm_tokens 테이블 생성 확인), api 컨테이너 healthy. ③ **운영 E2E 전부 통과**: 인증가드(토큰없음 403)·수신설정 조회(11종 기본값 인앱ON/외부OFF)·부분 upsert(ASSIGNED email ON 반영)·미지원type 거부(WMP-7839)·FCM 등록/삭제 왕복(200/200)·**이메일 실발송**(bp-notification WMP_NOTI_ASSIGNED→SMTP provider success·requestId 발급). 검증용 설정 원복 완료. **운영계정**: admin@workmap.com/admin1234(운영 users 1명). BE↔bp-notification 통합 경로는 양 끝단 검증+단위테스트(209/209)로 확인(운영 사용자 1명이라 본인액션 스킵으로 자동발송 자연유발은 사용자 추가 후). ⚠️ admin 템플릿 등록은 jq로 JSON 생성(HTML 큰따옴표 수동 이스케이프 시 7001 파싱실패). **FE 배포는 보류** — chat 모듈(ReactionBar export 변경 중) 미완성으로 FE 빌드 실패, chat 완료 후 동행 배포.
- **인앱 실시간 표시 추가(2026-06-29, FE)**: 사용자 요청 "알림 오면 앱 열려있을 때 토스트로?" → 실측 결과 받은함 폴링·토스트·벨 배지 전무(직접 들어가 새로고침해야 보임)였음. 알림 시스템 확장의 일부로 추가. **헤더 알림 벨**(AppShell HeaderActions, `NotificationBell`) — 안읽음 배지(빨강 99+캡) + `GET /notifications/unread-count` **30초 폴링**(로그인 시·포커스복귀) + 벨 클릭 시 Popover 최근 8건 드롭다운(NotificationRow 재사용·읽음처리·전체보기). **새 알림 토스트**(`useNewNotificationToast`, 헤더 1회 마운트) — 안읽음 증가 감지 시 ds-ui Toast(sonner) "새 알림 N건"+[보기]→/inbox, 최초 로드는 기준선만(누적분 안 띄움). 계정 아바타 메뉴에 **알림 설정** 진입 추가. T3-3 "헤더 알림 벨" 섹션 신규. inbox/api.ts에 unreadCount() 추가. **⚠️ tsc 시 chat 모듈(ReactionBar export 변경 중) 미커밋 에러 — CR-028 무관**(chat stash 후 tsc/vite 빌드 통과 확인, 알림 파일 에러 0). 폴링은 채팅(5s)보다 길게 30s.
- **CR-029 모바일 앱(Capacitor 래핑) — 설계 캐스케이드 완료, 구현 미착수(2026-06-29, 중규모)**: 사용자 "앱용으로도 제작, 할 수 있는 것 위주로. 추후 카메라·푸시·음성도". 셋이 로드맵 확정이라 PWA의 iOS 제약(웹푸시·STT 반쪽) 회피 위해 **Capacitor 래핑** 채택(현 React/Vite 자산 재활용, RN 안 씀). 참고=`dev-labs/bp-issues-front`(동일 조직 Capacitor 8+push, `capacitor.config.ts`·`usePushNotifications` 훅 실측). **결정(사용자 합의)**: 방식=Capacitor / 타깃=iOS·Android 둘 다(Xcode·AndroidStudio 설치 확인) / **CR-029 범위=App Shell(WMP-APP-001)만 구현**, 푸시·카메라·음성(002~004)은 **설계만 선기재**·구현은 후속 CR / API=운영 BE 절대URL 고정(`http://59.8.160.12:8186`, 앱은 dev프록시 없음) / **BE 변경 0**. **실측 확인**: BE `POST·DELETE /api/v1/fcm/token` 이미 존재(CR-028 FcmTokenController), FE `registerFcmToken`/`deleteFcmToken` 이미 존재(미배선), 파일 업로드 `/files/upload`(CR-024) 재사용 가능. **설계 캐스케이드 완료**: T1-1(모듈 J 신규·WMP-APP-001~004)·execution-spec(§CR-029 횡단 가이드)·T3-3(모바일 앱 셸 항목)·CR_변경_이력(CR-029)·CLAUDE.md. T1-3/4/5/6·T3-1/2 무변경(앱 패키징은 비즈규칙·FSM·이벤트·스키마·API 변경 아님). 에러코드·마이그레이션 없음. **App Shell 구현 작업(미착수)**: frontend에 `@capacitor/core·cli·ios·android` 의존(푸시/카메라/음성 플러그인 제외) + `capacitor.config.ts`(appId=`com.therecommerce.workmap`·webDir=`dist`·allowNavigation=[`59.8.160.12`]·cleartext·SplashScreen) + api-client baseURL 네이티브 분기(운영BE 절대URL) + package.json 스크립트(build:mobile·sync·open) + `npx cap add ios/android` + 시뮬레이터 기동 확인. ⚠️ Capacitor 의존 추가 후 [[workmap-tailwind-lnb-trap]] LNB 재확인 필수.
- **다음 작업 = (CR-029) 설계 완료. App Shell 구현은 사용자 승인 후 착수(중규모 규칙). / (CR-027) BE 완료. 남은 것 = FE 배포(CR-028 FE 배포에 동행 — chat MessagePane 미완성 해소 후 함께) + 브라우저 화면 E2E(관리자 초대→메일 인증번호 수신→/invite/accept 가입→로그인 / forgot→reset / 로그인상태 변경) / (CR-026) 운영 배포(deploy.sh be — V8 Flyway 적용·채널/메시지 운영 검증, deploy.sh fe — `nvm use 22`) / 채팅 화면 E2E(로그인→채널 생성→메시지·스레드·리액션 실동작) / (CR-025) 운영 배포·검증 / (CR-024) 브라우저 화면 E2E / 테스트 환경 jsdom ERR_REQUIRE_ESM 정리. ⚠️ FE에 무거운 라이브러리 추가 시 Tailwind v4 유틸 정렬 변동으로 ds-ui 반응형(hidden md:block)이 깨질 수 있음 — 배포 후 LNB 확인 필수. BE는 Phase1 + P2(CR-012) + CR-024 + CR-025 + CR-026 100% 완료(운영 배포만 대기).**
- **운영 배포 함정(2026-06-27)**: `deploy.sh`의 `pnpm build`는 활성 Node 버전을 따른다. Node 18에서는 corepack pnpm이 `Invalid host defined options`로 깨짐 → **반드시 `nvm use 22` 후 `./deploy.sh fe` 실행**(Node22+pnpm11). FE는 외부 nginx가 `/home/therecommerce/workmap/frontend/`를 서빙(8186은 BE 포트라 정적 403은 정상).
- 설계 baseline은 git push 완료(johnnykim7/workmap, main). 구현은 develop 브랜치(CR-007~012 누적 푸시 완료, 최신 1f36bb8).
- **착수 시 첫 읽기 순서**: 이 CLAUDE.md → docs/origins/2026-06-23_세션인계_v0.4설계완료_구현착수전.md(직전 세션 인계) → docs/execution-spec.md(§5 Sprint별 가이드) → 해당 Sprint의 T3-1/T3-2/T1-5/T3-5.

## 참조 문서 (전부 v0.4/CR-006 기준)
- 실행스펙(구현 진입점): ./docs/execution-spec.md
- 기능 요구사항: ./docs/T1-1_기능요구사항_명세서.md
- 비즈니스 규칙/정책: ./docs/T1-3_비즈니스_규칙.md · ./docs/T1-4_정책_정의.md
- FSM 상태/전이: ./docs/T1-5_FSM_상태_정의.md
- 이벤트 계약: ./docs/T1-6_이벤트_계약.md
- 데이터 모델: ./docs/T3-1_데이터_모델.md
- API 설계: ./docs/T3-2_API_설계.md
- 화면 구조(IA)+UI 규칙: ./docs/T3-3_화면_구조.md
- 단위테스트 명세: ./docs/T3-5_단위테스트_명세.md
- 변경 이력: ./docs/CR_변경_이력.md (CR-006 = v0.4 전환 본체)
- 정본 기획: ./docs/origins/WorkMap_제품기획서_v0.4_Jira기반.md
- Jira 화면 인벤토리(캡처 누적용): ./docs/origins/WorkMap_Jira화면_인벤토리_v1.md

## 변경 규모 판단 및 설계 우선 원칙

> **Claude Code는 소스 코드 수정 전에 반드시 사용자에게 변경 규모를 확인한다.**
> `.claude/hooks/enforce-workflow.sh`가 소스 코드 수정 시 자동으로 게이트를 발동한다.

### 판단 게이트
소스 코드 수정 시점에 질문한다: "이 변경의 규모를 어떻게 보시나요? (소규모/중규모/대규모)"
사용자가 판단할 때까지 코드 수정을 시작하지 않는다. (이미 이번 세션에서 판단했으면 건너뜀)

### 규모별 필수 절차
- **소규모**: Plan → 구현 → 단위테스트 → (필요 시 CR 기록) → commit
- **중규모**: 설계 캐스케이드(T1→T2→T3) → (필요 시 CR 기록) + B-lite 메타 갱신 → 설계 commit → 구현 → 단위테스트 → commit
- **대규모**: 방법론 재진입 → 설계 캐스케이드(T1→T2→T3→execution-spec) → CR(영향도 High) → 설계 commit → 구현 → 단위테스트

### CR 부여 원칙 (2026-06-27 사용자 결정 — 중요)
> **이미 v0.4에 계획·설계가 확정된 Sprint를 그대로 구현하는 것은 "변경"이 아니라 "실행"이다. CR 번호를 붙이지 않는다.**
- CR(Change Request)은 **계획 외 변경**(설계 개정·범위 추가·계획에 없던 기능·운영 중 발견된 버그로 인한 설계 보정)에만 부여한다.
- 계획된 Sprint 화면/모듈 구현(예: StubPage→실구현, BE Sprint 모듈 구현)은 **git 커밋 + CLAUDE.md "현재 진행 상태" 갱신**으로 진척을 기록한다. CR_변경_이력.md에 항목을 추가하지 않는다.
- 규모 판단(소/중/대)은 계속 한다 — 그건 절차(설계 캐스케이드 필요 여부)를 정하기 위함이지 CR 부여 여부와 별개다.
- 구현 중 **설계와 다른 점·버그·계획 외 결정**이 나오면 그때 CR을 부여한다(현재 차기 번호 CR-017).

### 금지 사항
- 사용자 규모 판단 없이 코드 수정 착수 금지
- 설계 문서 갱신 없이 중규모 이상 코드 변경 금지
- T3(API·화면)만 단독 수정 금지 — 반드시 T1부터 캐스케이드
- 화면 대규모 변경 시 T3-3 갱신 없이 구현 금지
- **계획된 Sprint 구현에 CR 번호 부여 금지** (위 CR 부여 원칙)

## FlowGuard 연동
- 본 프로젝트는 사용자 결정에 따라 **FlowGuard 등록을 이번엔 생략**한다(2026-06-19).
- 추후 등록 시: `flowguard_get_registration_workflow` 절차를 따르고 Step 0-5(등록 계획 브리핑)을 반드시 수행한다.

## 원본 요구사항 관리 (docs/origins/)
- 원본은 `docs/origins/`에 정제하지 않고 보관. 기존 파일 수정 금지, 변경분은 별도 파일.
- 대화로 입력된 기획 변경/추가는 즉시 새 파일로 기록.

## 주의사항 (구현 중 발견 누적)
- 예시: MyBatis Enum은 `EnumTypeHandler` 또는 String 매핑 명시 필요.
- **(CR-007) API prefix는 `/api/v1`.** SecurityWhitelist 패턴도 `/api/v1/auth/login` 처럼 v1 포함해야 함(불일치 시 로그인 403).
- **(CR-007) JSONB List 컬럼**(active_tabs/issue_type_codes 등): `StringListJsonTypeHandler` 사용 + JDBC URL에 `stringtype=unspecified` 필수(String→jsonb 캐스팅). application.yml에 `mybatis.mapper-locations`/`type-handlers-package` 설정 필요.
- **(CR-007) @PreAuthorize 거부는 500이 됨.** bp-common-lib GlobalExceptionHandler가 AccessDeniedException을 일반 Exception(500)으로 처리 → WorkMap `WmpSecurityExceptionHandler`(HIGHEST_PRECEDENCE)로 403 매핑. 새 보안 예외 추가 시 여기 보강.
- **(CR-007) bp-common-lib `@AuthUserInfo("userId")`** 로 컨트롤러에서 인증 사용자 ID 주입(`@AuthUserId` 같은 커스텀 어노테이션 없음). `postgresql`은 build.gradle에서 `runtimeOnly`라 `PGobject` 등 컴파일 의존 불가.
- **(CR-008) JSONB List TypeHandler는 자동 스캔 금지.** `mybatis.type-handlers-package` 자동 스캔은 하위 패키지까지 재귀 등록하며, `BaseTypeHandler<List<X>>` 핸들러를 raw `List` 키로 등록한다. String/Long 두 리스트 핸들러가 공존하면 나중 등록이 다른 것을 가로채 역직렬화 500(예: active_tabs를 Long 핸들러가 파싱). → 자동 스캔 제거하고 `AppConfig.ConfigurationCustomizer`에서 `StringListJsonTypeHandler`만 `List`에 명시 등록, 그 외 리스트 핸들러는 스캔 밖(`common.mybatis.scalar`)에 두고 매퍼 XML에서 명시 지정. **새 JSONB List 컬럼/핸들러 추가 시 이 규칙 준수.**
- **(CR-008) NOT NULL JSONB 배열 컬럼은 서비스에서 빈 리스트 기본값.** `work_items.labels/related_solutions`는 `NOT NULL DEFAULT '[]'`이지만 INSERT가 `#{...}`로 컬럼을 항상 포함하므로 null이면 DB default가 무시돼 위반. create 시 `null → List.of()` 보정 필요.
- **(CR-008) MyBatis 도메인 매핑은 setter 기반 — `@NoArgsConstructor` 권장.** 기존 도메인 다수가 `@Builder`만 보유. 자동 스캔 시절엔 우연히 동작했으나, 핸들러 명시 등록으로 바꾸면 no-arg 생성자 + setter 매핑이 안전(신규 도메인 Sprint/Approval은 `@NoArgsConstructor @AllArgsConstructor @Builder` 모두 부여).
- **(CR-009) 신규 매퍼 추가 시 기존 `@WebMvcTest` 슬라이스에 `@MockBean` 동반 등록 필수.** 메인 앱 `@MapperScan("com.therecommerce.workmap.**.mapper")`이 컨트롤러 슬라이스 컨텍스트에도 적용되어, 신규 매퍼 빈을 SqlSessionFactory 없이 생성하려다 컨텍스트 로딩 실패(`Property 'sqlSessionFactory' or 'sqlSessionTemplate' are required` — 알파벳 첫 매퍼가 대표로 던짐). → User/Project/WorkItem ControllerTest 등 `@WebMvcTest`에 신규 매퍼 `@MockBean`을 추가해야 한다. (이 에러는 특정 XML 문법오류처럼 보이지만 실제론 매퍼 빈 mock 누락이 원인.)
- **(CR-009) 관리자 권한 가드는 `hasAnyRole`(ROLE_ 접두 O — 런타임 실측).** bp-common-lib **0.1.0**(실제 resolved 버전) `JwtFilter`는 `new SimpleGrantedAuthority("ROLE_" + role)`로 세팅(상수풀 `ROLE_` = makeConcatWithConstants 확인). 따라서 `@PreAuthorize("hasAnyRole('OWNER','ADMIN')")` 사용(UserController와 동일 컨벤션). **함정: gradle 캐시에 0.5.x jar도 있어 javap 대상을 잘못 고르면 "접두 없음"으로 오판함 — 반드시 resolved 0.1.0 jar를 디컴파일하거나 E2E(ADMIN 토큰으로 403/200)로 확정할 것.** ADMIN 토큰으로 admin API 403이면 가드가 hasAuthority로 잘못된 것.
- **(CR-009) 외부 namespace resultMap 재사용 가능.** DashboardMapper.xml이 `resultMap="com.therecommerce.workmap.workitem.mapper.WorkItemMapper.workItemMap"`로 WorkItem 매핑(JSONB typeHandler 포함)을 재사용 — work_items 전체 컬럼 매핑을 중복 정의하지 않는다. `SELECT wi.*` + 외부 resultMap 조합 동작 확인됨.

## bp-common-lib 기여 후보
> 구현 중 2개 이상 프로젝트 공통 필요 코드 발견 시 기록. 스프린트 종료 시 전달.

| 항목 | 설명 | 발견 위치 | 판단 근거 |
|------|------|-----------|----------|
| (구현 중 발견 시 추가) | | | |
