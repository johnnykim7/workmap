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
- **다음 작업 = Sprint 1(세팅) 구현 착수.** 아직 backend/ 없음(미생성). frontend/는 목업(참고용, v0.4 실구현은 새로).
- 설계 baseline은 git push 완료(johnnykim7/workmap, main). 구현은 feat/SPR-{N} 브랜치에서.
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
- **소규모**: Plan → 구현 → 단위테스트 → CR 기록 → commit
- **중규모**: 설계 캐스케이드(T1→T2→T3) → CR 기록 + B-lite 메타 갱신 → 설계 commit → 구현 → 단위테스트 → commit
- **대규모**: 방법론 재진입 → 설계 캐스케이드(T1→T2→T3→execution-spec) → CR(영향도 High) → 설계 commit → 구현 → 단위테스트

### 금지 사항
- 사용자 규모 판단 없이 코드 수정 착수 금지
- 설계 문서 갱신 없이 중규모 이상 코드 변경 금지
- T3(API·화면)만 단독 수정 금지 — 반드시 T1부터 캐스케이드
- 화면 대규모 변경 시 T3-3 갱신 없이 구현 금지

## FlowGuard 연동
- 본 프로젝트는 사용자 결정에 따라 **FlowGuard 등록을 이번엔 생략**한다(2026-06-19).
- 추후 등록 시: `flowguard_get_registration_workflow` 절차를 따르고 Step 0-5(등록 계획 브리핑)을 반드시 수행한다.

## 원본 요구사항 관리 (docs/origins/)
- 원본은 `docs/origins/`에 정제하지 않고 보관. 기존 파일 수정 금지, 변경분은 별도 파일.
- 대화로 입력된 기획 변경/추가는 즉시 새 파일로 기록.

## 주의사항 (구현 중 발견 누적)
- (구현 중 추가)
- 예시: MyBatis Enum은 `EnumTypeHandler` 또는 String 매핑 명시 필요.

## bp-common-lib 기여 후보
> 구현 중 2개 이상 프로젝트 공통 필요 코드 발견 시 기록. 스프린트 종료 시 전달.

| 항목 | 설명 | 발견 위치 | 판단 근거 |
|------|------|-----------|----------|
| (구현 중 발견 시 추가) | | | |
