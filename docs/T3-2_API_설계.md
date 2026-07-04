# WorkMap API 설계

> 설계 버전: 2.0 | 최종 수정: 2026-06-23 | 관련 CR: CR-006

> 단계: 3. Detail Design | 실행스펙 섹션 3에 포함
> 경로 + 메서드 + 한줄 설명 수준. Request/Response 상세 스키마는 구현 시 T3-1 데이터 모델에서 도출.

---

## 공통 사항

### 공통 라이브러리 참조
- **공통 라이브러리**: `com.therecommerce:bp-common-lib:0.1.0`
- **참조 문서**: `AI-SDLC_공통라이브러리_레퍼런스.md`

| 영역 | 제공 | 적용 방식 |
|------|------|----------|
| 응답 포맷(래퍼) | 예 | `ResponseDto<T>` |
| 에러 코드 체계 | 예 | `ErrorCode` 구현체(`WorkMapErrorCode`, 7700번대) |
| 페이징 | 예 | `PageRequest`/`PageResponse`/`PagingRequestDto` |
| 인증/인가 | 예 | `JwtTokenProvider`/`JwtFilter` 상속 + `SecurityWhitelist` 구현 |
| 로깅 | 예 | 자동 등록(`RequestLoggingFilter`/`TraceIdFilter`) |
| 검색/필터 | 예 | `SearchConditionRequest`/`SearchConditionUtil` |

> "예" 항목은 **직접 구현 금지**. 라이브러리 규격 사용.

### API 기본 규격
- **Base URL**: `/api/v1`
- **인증**: 🔒 표시 엔드포인트에 JWT 필요. 역할 제한은 🔒 Admin·🔒 Manager 표기(POL-004).
- **응답 래퍼**: `ResponseDto<T>`
- **페이징**: `PageResponse<T>` (page, size, totalElements, content)
- **에러 코드**: `WorkMapErrorCode` (7700~)
- **우선순위**: **P1** = Phase 1 MVP · **P2** = Phase 2
- 경로: kebab-case, 복수 명사. 행위(RPC)형은 `POST/PATCH /{resource}/{id}/{action}`.

---

## A. 인증 (Auth)

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| POST | /auth/login | 로그인 (JWT 발급) | | P1 | WMP-AUTH-001 |
| POST | /auth/logout | 로그아웃 (토큰 무효화) | 🔒 | P1 | WMP-AUTH-002 |
| GET | /auth/me | 내 정보(프로필·역할) 조회 | 🔒 | P1 | WMP-AUTH-003 |
| GET | /auth/invitations/{token} | 초대 토큰 미리보기(수락 화면 진입 — 이메일·이름·만료 표시) | | P1 | WMP-AUTH-006 |
| POST | /auth/invitations/accept | 초대 수락(토큰+새 비밀번호 → user 생성·로그인) | | P1 | WMP-AUTH-006 |
| POST | /auth/password/forgot | 분실 재설정 — 재설정 링크(토큰) 발송(계정 열거 방지: 항상 성공 응답) | | P1 | WMP-AUTH-007 |
| POST | /auth/password/reset | 재설정 완료 — 토큰+새 비밀번호 검증·변경 | | P1 | WMP-AUTH-007 |
| POST | /auth/password/change/request-otp | 변경 1단계 — 본인 이메일로 인증번호 발송 | 🔒 | P1 | WMP-AUTH-008 |
| POST | /auth/password/change | 변경 2단계 — 현재 비밀번호+인증번호+새 비밀번호(2차 인증) | 🔒 | P1 | WMP-AUTH-008 |
| POST | /auth/signup-requests | 가입 요청(공개 — 이메일·이름·사유). user 미생성, PENDING 접수 | | P1 | WMP-AUTH-010 |

> **CR-027 토큰 보정**: 초대·분실재설정은 **토큰 링크**(인증번호 입력 제거). 변경(CHANGE)만 인증번호 유지.
> **토큰 규칙(POL-013-A)**: 추측 불가 랜덤(해시 저장), 초대 만료 72h·재설정 30분, 1회용, 시도제한 불요(고엔트로피). 발송은 bp-notification(WMP-AUTH-009, `WMP_INVITE_LINK`/`WMP_RESET_LINK`) — 토큰 평문은 응답·로그에 비노출(링크 URL만 메일에).
> **인증번호 규칙(POL-013-B, CHANGE만)**: 6자리, 만료 10분, 시도 5회, 쿨다운 60초.
> **요청/응답 요약**:
> - `GET invitations/{token}` → res: `{ email, name, role, expiresAt }`(무효/만료 시 404/410). 비밀번호 미입력 — 화면 프리필용.
> - `accept` req: `{ token, password }` → res: `{ accessToken, refreshToken, user }`(가입 즉시 로그인).
> - `forgot` req: `{ email }` → res: `{}`(200, 존재 여부 불문 동일).
> - `reset` req: `{ token, password }` → res: `{}`.
> - `change/request-otp` req: `{}`(인증 컨텍스트의 이메일 사용) → res: `{}`.
> - `change` req: `{ currentPassword, code, newPassword }` → res: `{}`. 현재 PW 불일치=401(INVALID_CREDENTIALS), 새 PW=현재 PW 동일 시 400.

## B. 사용자 (Users)

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET | /users | 사용자 목록(검색·페이징) | 🔒 | P1 | WMP-AUTH-005 |
| POST | /users | 사용자 직접 생성(이름·역할·부서·비밀번호 — 시드/마이그레이션용, Admin) | 🔒 Admin | P2 | WMP-AUTH-005 |
| POST | /invitations | 사용자 초대(이메일·이름·역할·부서·**workspaceId(CR-033)** → invitations 생성 + 링크 발송. 수락 시 그 WS 자동 합류) | 🔒 Admin | P1 | WMP-AUTH-004 |
| GET | /invitations | 초대 목록(상태 필터: PENDING/ACCEPTED/EXPIRED) | 🔒 Admin | P2 | WMP-AUTH-004 |
| POST | /invitations/{id}/resend | 초대 인증번호 재발송(쿨다운 적용) | 🔒 Admin | P2 | WMP-AUTH-004 |
| DELETE | /invitations/{id} | 초대 취소(REVOKED) | 🔒 Admin | P2 | WMP-AUTH-004 |
| GET | /signup-requests | 가입 요청 목록(상태 필터) | 🔒 Admin | P1 | WMP-AUTH-010 |
| POST | /signup-requests/{id}/approve | 승인(**역할·workspaceId 지정(CR-033)** → 초대 발송) | 🔒 Admin | P1 | WMP-AUTH-010 |
| POST | /signup-requests/{id}/reject | 거절(사유 선택) | 🔒 Admin | P1 | WMP-AUTH-010 |
| PATCH | /users/{id} | 사용자 수정(역할·부서) | 🔒 Admin | P1 | WMP-AUTH-005 |
| PATCH | /users/{id}/deactivate | 비활성화(소프트 삭제) | 🔒 Admin | P1 | WMP-AUTH-005 |

> **CR-027 변경**: 기존 `POST /users`의 "초대" 역할은 `POST /invitations`로 분리. `POST /users`는 비밀번호를 직접 지정하는 직접 생성(시드/관리 목적)으로 남기되 권장 가입 경로는 초대다. invitations는 user를 즉시 만들지 않고 수락 시점에 생성한다.

## C. 워크스페이스 (Workspaces)

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET | /workspaces | 워크스페이스 목록 — **내가 속한 WS만**(BIZ-112). Admin도 멤버 WS만 | 🔒 | P1 | WMP-WS-001·008 |
| POST | /workspaces | 워크스페이스 생성(생성자 자동 멤버 추가) | 🔒 Admin | P1 | WMP-WS-001 |
| GET | /workspaces/{id} | 워크스페이스 상세 — **비멤버 403**(WMP-7803) | 🔒 | P1 | WMP-WS-001 |
| PATCH | /workspaces/{id} | 워크스페이스 수정 | 🔒 Admin | P1 | WMP-WS-001 |
| GET | /workspaces/{id}/members | WS 멤버 목록 | 🔒 | P1 | WMP-WS-007 |
| POST | /workspaces/{id}/members | WS 멤버 추가(전사 Admin만) | 🔒 Admin | P1 | WMP-WS-007 |
| DELETE | /workspaces/{id}/members/{userId} | WS 멤버 제거(전사 Admin만) | 🔒 Admin | P1 | WMP-WS-007 |

> **WS 격리 가드(BIZ-112, CR-018) — 전 목록 API 공통.** `GET /projects`·`/work-items`·`/search`·`/inbox`·`/dashboard/*`는 호출자의 `workspace_members` 교집합으로 1차 필터(서버 강제). 클라이언트가 보낸 `?workspaceId=`는 "멤버인 WS 중 더 좁히기"로만 작동 — 멤버 아닌 WS면 빈 결과(또는 403). 비멤버가 wsId를 위조해도 데이터 노출 0. 가시성 2차(PUBLIC/PRIVATE)는 이 1차 통과 후 적용(BIZ-108).
> **WS 선택/전환(WMP-WS-008)은 별도 API 없음** — 선택은 클라이언트 상태(localStorage), 진입 시 위 가드가 멤버십을 서버에서 재검증한다. 선택 가능 목록 = `GET /workspaces`(내 WS만).
>
> **신규 에러코드(CR-018, WMP-7803~7805)**: `WORKSPACE_ACCESS_DENIED`(WMP-7803, 비멤버 접근 403), `WORKSPACE_MEMBER_NOT_FOUND`(WMP-7804, 제거 대상 없음 404), `WORKSPACE_MEMBER_DUPLICATED`(WMP-7805, 이미 멤버 409). WS 미존재는 기존 `WORKSPACE_NOT_FOUND`(WMP-7722) 재사용. (실측 정정: 코드 마지막은 WMP-7799가 아니라 **WMP-7802** — 7800~7802는 CR-012 현장검증/저장필터가 선점. WS는 7803부터.)

## D. 프로젝트 (Projects)

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET | /projects | 프로젝트 목록(워크스페이스·유형·상태 필터, 보관 제외) | 🔒 | P1 | WMP-WS-003 |
| POST | /projects | 프로젝트 생성(유형 프리셋→활성 탭) | 🔒 Manager | P1 | WMP-WS-002 |
| GET | /projects/{id} | 프로젝트 상세 | 🔒 | P1 | WMP-WS-003 |
| PATCH | /projects/{id} | 프로젝트 수정(탭 조합·순서·기본탭 편집) | 🔒 Manager | P2 | WMP-WS-004 |
| PATCH | /projects/{id}/archive | 보관(소프트) | 🔒 Manager | P2 | WMP-WS-004 |
| PATCH | /projects/{id}/visibility | 가시성 변경(PUBLIC/PRIVATE) | 🔒 Manager | P1 | WMP-WS-006 |
| GET | /projects/{id}/summary | 프로젝트 홈 요약(전체/완료/지연/막힘/진행률) | 🔒 | P1 | WMP-WS-003 |
| GET | /projects/{id}/tabs | 탭 메뉴 데이터(코드·라벨·기본탭 — 폴백 적용된 표시명) | 🔒 | P2 | WMP-WS-004·CR-020 |
| PUT | /projects/{id}/tabs/{code}/label | 탭 이름 바꾸기(프로젝트별 오버라이드 UPSERT) | 🔒 Manager | P2 | WMP-WS-004·CR-020 |
| DELETE | /projects/{id}/tabs/{code}/label | 탭 이름 되돌리기(오버라이드 삭제→기본값 폴백) | 🔒 Manager | P2 | WMP-WS-004·CR-020 |

> **Jira 탭 호버 `…` 메뉴(CR-020)의 동작 매핑**:
> - **좌·우 이동 / 제거** = `PATCH /projects/{id}` body `activeTabs`(순서 바뀐/원소 제거된 전체 배열). summary는 이동·제거 불가(서버 가드). active_tabs 구조 무변경.
> - **기본값으로 설정** = `PATCH /projects/{id}` body `defaultTab`(탭 코드). 진입 시 첫 화면.
> - **이름 바꾸기** = `PUT /projects/{id}/tabs/{code}/label` body `{label}`. 되돌리기 = DELETE.
> - 라벨 표시는 폴백: project_tab_label → tab_def → code. `GET /projects/{id}/tabs`가 폴백 적용된 최종 표시명을 내려준다(프런트가 상수 의존 제거).
>
> **신규 에러코드(CR-020, WMP-7806~7808)**: `TAB_NOT_FOUND`(WMP-7806, 알 수 없는 탭 코드 404), `TAB_LABEL_INVALID`(WMP-7807, 라벨 공백/길이 초과 400), `TAB_SUMMARY_LOCKED`(WMP-7808, summary는 제거·이동·기본해제 불가 400). 프로젝트 미존재는 기존 `PROJECT_NOT_FOUND` 재사용.

## E. 프로젝트 멤버 (Members)

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET | /projects/{id}/members | 멤버 목록 | 🔒 | P1 | WMP-WS-005 |
| POST | /projects/{id}/members | 멤버 초대·역할 부여 | 🔒 Manager | P1 | WMP-WS-005 |
| DELETE | /projects/{id}/members/{userId} | 멤버 제거 | 🔒 Manager | P1 | WMP-WS-005 |

## F. 업무 항목 (Work Items)

> 핵심 단일 테이블. Epic/Story/Task/Bug/Sub-task는 `issue_type` + `parent_id`/`epic_id` 계층(BIZ-106). 백로그·보드·목록·타임라인·이슈는 모두 work_item의 파생 뷰.
> **VIEWER 읽기전용 가드(POL-004, CR-031).** 쓰기(POST/PATCH/DELETE — 생성·수정·삭제·상태·담당자·유형전환·측정·스프린트·하위작업·댓글·첨부·링크·스프린트 시작/완료·현장검증·백로그전환·승인결정)는 `@PreAuthorize` `hasAnyRole('OWNER','ADMIN','MANAGER','MEMBER')`로 VIEWER 차단(403). 조회(GET)는 VIEWER 포함 전원 허용. 저장필터·채팅은 개인/소통 영역이라 VIEWER도 쓰기 허용(예외). 가드 SpEL은 `WmpAuthz.WRITER` 상수로 통일 관리.

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET | /work-items | 통합 목록(검색·필터·정렬·페이징·퀵필터) | 🔒 | P1 | WMP-VIEW-001·004 |
| POST | /work-items | 업무 항목 생성(만들기 모달, key 자동 발급) | 🔒 | P1 | WMP-WI-001 |
| GET | /work-items/{id} | 상세 조회(하위·연결·댓글·이력, 유형별 분기) | 🔒 | P1 | WMP-WI-004 |
| PATCH | /work-items/{id} | 필드 수정(인라인 편집·우선순위/기한/라벨) | 🔒 | P1 | WMP-WI-002·008 |
| DELETE | /work-items/{id} | 소프트 삭제(deleted_at) | 🔒 | P1 | WMP-WI-003 |
| POST | /work-items/{id}/subtasks | 하위 작업(Sub-task) 생성 | 🔒 | P1 | WMP-WI-005 |
| PATCH | /work-items/{id}/status | 상태 전이(FSM 화이트리스트 + 공통상태 환산) | 🔒 | P1 | WMP-WI-007 |
| PATCH | /work-items/{id}/assignee | 담당자/보고자 지정·변경 | 🔒 | P1 | WMP-WI-006 |
| PATCH | /work-items/{id}/convert | 유형 전환(Move/Convert, 계층 재검증) | 🔒 | P1 | WMP-WI-014 |
| PATCH | /work-items/bulk | 벌크 편집(상태·담당자·스프린트·라벨 일괄) | 🔒 | P1 | WMP-WI-015 |
| PATCH | /work-items/{id}/measure | 측정(단위·목표·현재값, progress 자동) | 🔒 | P1 | WMP-WI-016 |

### F1. 연결된 업무 항목 (Links)

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET | /work-items/{id}/links | 연결 목록 | 🔒 | P2 | WMP-WI-013 |
| POST | /work-items/{id}/links | 링크 생성(양방향 자동) | 🔒 | P2 | WMP-WI-013 |
| DELETE | /work-items/{id}/links/{linkId} | 링크 제거 | 🔒 | P2 | WMP-WI-013 |

### F2. 댓글 / 첨부 / 활동이력

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET | /work-items/{id}/comments | 댓글 목록 | 🔒 | P1 | WMP-WI-009 |
| POST | /work-items/{id}/comments | 댓글 작성(@멘션) | 🔒 | P1 | WMP-WI-009 |
| GET | /work-items/{id}/attachments | 첨부 목록 | 🔒 | P1 | WMP-WI-012 |
| POST | /work-items/{id}/attachments | 파일 첨부 | 🔒 | P1 | WMP-WI-012 |
| DELETE | /work-items/{id}/attachments/{attachmentId} | 첨부 삭제(메타+디스크 파일) | 🔒 | P1 | WMP-WI-012 |
| GET | /work-items/{id}/activities | 활동/변경 이력 | 🔒 | P1 | WMP-WI-011 |

- **첨부 삭제(CR-037)**: DELETE는 첨부 메타(attachments 행) + 서버 디스크의 실제 파일을 함께 제거. work_item 소속 검증(다른 항목 첨부 삭제 차단). 없는 첨부는 `ATTACHMENT_NOT_FOUND`(WMP-7846). 쓰기 가드(`WmpAuthz.WRITER`, VIEWER 차단). 디스크 파일 삭제 실패는 로그만 남기고 메타 삭제는 진행(best-effort — 이미 지워진 파일 등).

### F3. 파일 업로드 (리치 에디터 인라인 이미지 — CR-024)

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| POST | /files/upload | 파일 업로드 → 저장 URL 반환(multipart/form-data) | 🔒 | P2 | WMP-WI-001 |
| GET | /files/serve/{storedName} | 업로드 파일 정적 서빙(이미지 렌더) | 🌐 화이트리스트 | P2 | WMP-WI-001 |

- **용도**: work_item `description` 등 Tiptap 리치 에디터의 **인라인 이미지**. 에디터에서 이미지 삽입/붙여넣기/드롭 시 본 API로 먼저 업로드하고, 반환 URL만 description HTML(`<img src="...">`)에 박는다. 이미지 바이너리는 description에 들어가지 않는다(본문=HTML 문자열, 이미지=URL 참조).
- **work_item에 안 묶음**: 만들기 모달 시점엔 work_item ID가 없으므로 `/files/upload`는 독립 경로(특정 항목 하위 아님). 기존 `/work-items/{id}/attachments`(첨부 메타)와는 별개.
- **서빙 경로 분리**: 정적 서빙은 `/files/serve/{name}`(업로드 `/files/upload`와 패턴이 안 겹침). `<img src>`는 인증 헤더가 없으므로 **서빙 경로만 화이트리스트 공개**, 업로드(POST)는 인증 유지(bp-common-lib 화이트리스트가 메서드 무관 매칭이라 경로로 분리).
- **저장**: 서버 **로컬 디스크**. 경로·최대크기·허용타입은 `application.yml` 설정(`workmap.upload.dir` 기본 `/home/therecommerce/workmap/uploads`, `workmap.upload.allowed-content-types`, `workmap.upload.public-base` 기본 `/api/v1/files/serve`, `spring.servlet.multipart.max-file-size` 기본 10MB)으로 조정. 허용 타입 화이트리스트(image/png·jpeg·gif·webp). 저장 파일명은 충돌·traversal 방지 위해 UUID + 정규화된 확장자.
- **응답**: `{ url, fileName, fileSize, contentType }`(axopm FileUploadResult 동형).
- **에러코드**: WMP-7809~7813(파일 없음/타입 거부/크기 초과/저장 실패/파일 없음). ⚠️ 설계 초안의 7803~7805는 워크스페이스(7803~7805)·탭(7806~7808)이 이미 점유 — 실측 후 7809부터로 정정. 7700번대 규칙 준수.

## G. 애자일 실행 (Agile — Backlog/Sprint/Board)

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET | /projects/{id}/backlog | 백로그(스프린트들 + 백로그, Epic 그룹 트리) | 🔒 | P1 | WMP-AGL-001 |
| GET | /projects/{id}/sprints | 스프린트 목록 | 🔒 | P1 | WMP-AGL-001 |
| POST | /projects/{id}/sprints | 스프린트 생성 | 🔒 | P1 | WMP-AGL-001 |
| POST | /sprints/{id}/start | 스프린트 시작(기간 고정, 동시 ACTIVE 1개) | 🔒 | P1 | WMP-AGL-003 |
| POST | /sprints/{id}/complete | 스프린트 완료(미완료 이월) | 🔒 | P1 | WMP-AGL-004 |
| PATCH | /work-items/{id}/sprint | 스프린트 담기/빼기(백로그↔스프린트 이동) | 🔒 | P1 | WMP-AGL-002 |
| GET | /projects/{id}/board | 보드(스크럼/칸반 컬럼별 카드) | 🔒 | P1 | WMP-AGL-005·OPS-001 |
| GET | /sprints/{id}/burndown | 번다운/번업(일자별 잔여/누적완료/기준선) | 🔒 | P2 | WMP-AGL-006 |
| GET | /projects/{id}/velocity | 벨로시티(완료 스프린트별 완료포인트 + 평균) | 🔒 | P2 | WMP-AGL-006 |

> **번다운(CR-012)**: `burndown_snapshots`(T3-1) 시계열 조회. 스냅샷은 `SprintStarted`(START 기준선)·일별 스케줄러(DAILY)·`SprintCompleted`(COMPLETE) 이벤트/배치가 적재 — 조회 API는 적재하지 않는다(읽기 전용). 벨로시티 = 해당 프로젝트 COMPLETE 스냅샷들의 `completed_points` 목록 + 평균.

## H. 운영 실행 (Operations)

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET | /projects/{id}/throughput | 일일/주간 처리량(담당자별 계획 대비 완료) | 🔒 | P1 | WMP-OPS-002 |
| POST | /work-items/{id}/promote-to-backlog | 현장 이슈→개발 백로그 전환(원본 링크 유지) | 🔒 | P1 | WMP-OPS-003 |
| GET | /work-items/{id}/field-verifications | 현장검증 기록 목록 | 🔒 | P2 | WMP-OPS-004 |
| POST | /work-items/{id}/field-verifications | 현장검증 기록(검증자/검증일/결과/발견이슈) + 후속업무 옵션 | 🔒 | P2 | WMP-OPS-004 |

> 운영형 보드는 G. 보드(`GET /projects/{id}/board`)를 워크플로(운영형) 기준으로 공유.
> **현장검증(WMP-OPS-004, CR-012)**: 검증 기록 저장은 단순 체크박스가 아니라 검증자/검증일/장소/환경/테스트내용/결과(PASS/FAIL/PARTIAL)/발견이슈를 기록(`field_verifications`, T3-1). 발견 이슈가 있으면 `createFollowUp=true`로 후속 업무 항목을 생성(원본↔후속 RELATES_TO 링크, BIZ-109 — promote-to-backlog와 동일 패턴). 결과에 따른 상태 전이(DEV_DONE→FIELD_VERIFYING→OPS_APPLIED, T1-5 현장검증형)는 별도 `PATCH /work-items/{id}/status`(FSM 가드 경유)로 수행 — 기록 저장이 상태를 직접 바꾸지 않는다(직접 status UPDATE 금지, BIZ-010).

### H1. 승인 (Approvals)

> 승인 = work_item 워크플로 게이트. `workflow_status.is_approval=true` 상태 도달 시 지정 승인자 승인 필요. 승인 시 다음 상태 진행, 거부 시 반려. 게이트 진입 시 approvals 행(decision=PENDING) 자동 생성.

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET | /projects/{key}/approvals | 승인 목록(승인 대기중/내가 요청/모든 승인 필터) | 🔒 | P1 | WMP-OPS-006 |
| GET | /work-items/{id}/approvals | 항목별 승인 이력 | 🔒 | P1 | WMP-OPS-006 |
| POST | /approvals/{id}/decision | 승인/거부 처리(body: decision APPROVE/REJECT, comment) | 🔒 승인자 | P1 | WMP-OPS-006 |

> 승인 게이트 설정(상태에 `is_approval`/`approver_role` 지정)은 워크플로 편집 API(`K. /admin/workflows/{id}/statuses`)에 포함 — 별도 엔드포인트 없음 | P1 | WMP-OPS-005.

## I. 보기 (View — Timeline/Calendar)

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET | /work-items | 목록 뷰(표/분할, 검색·필터·퀵필터) — F 모듈 공유 | 🔒 | P1 | WMP-VIEW-001·004 |
| GET | /projects/{id}/timeline | 타임라인/로드맵(start~due 막대) + **의존성 링크 병기(CR-037)** | 🔒 | P2 | WMP-VIEW-002·005·006 |
| GET | /projects/{id}/calendar | 캘린더(기한 기준 월별) | 🔒 | P2 | WMP-VIEW-003 |
| GET | /saved-filters | 저장 필터 목록(내 것 + 공유된 것) | 🔒 | P2 | WMP-VIEW-004 |
| POST | /saved-filters | 저장 필터 생성(name, query, isShared) | 🔒 | P2 | WMP-VIEW-004 |
| PUT | /saved-filters/{id} | 저장 필터 수정(소유자만) | 🔒 | P2 | WMP-VIEW-004 |
| DELETE | /saved-filters/{id} | 저장 필터 삭제(소유자만) | 🔒 | P2 | WMP-VIEW-004 |

> **저장 필터(WMP-VIEW-004, CR-012)**: `saved_filters`(T3-1) CRUD. `query`(JSONB)는 목록 필터 조건(유형·상태·담당자·우선순위·라벨·스프린트·Epic·기한·막힘·검색어)을 그대로 저장. `is_shared=true`면 전 사용자 목록에 노출, false면 owner만. 수정·삭제는 **소유자만**(owner_id 일치 검증). Phase 1의 기본/전문/퀵필터(WMP-VIEW-001·004)는 이미 `/work-items`에서 제공 — 저장/공유 부분만 여기서 추가.

> **타임라인 간트 고도화(WMP-VIEW-005·006, CR-037)**: `GET /projects/{id}/timeline` 응답을 `{ projectId, items[] }` → `{ projectId, items[], links[] }`로 확장(신규 엔드포인트 없음, 응답 형태만 추가). `links[]` = 프로젝트 내 work_item_links 중 **의존성 방향(BLOCKS/BLOCKED_BY)** 링크를 조인한 목록.
> - **응답 형태(신규 `TimelineLink`)**:
>   ```
>   TimelineResponse { projectId, items: TimelineItem[], links: TimelineLink[] }
>   TimelineLink { sourceId, targetId, linkType }   // linkType ∈ BLOCKS | BLOCKED_BY (의존성만)
>   ```
> - **중복 제거**: 링크는 양방향 저장(BIZ-109)이라 BLOCKS/BLOCKED_BY 짝이 둘 다 있음. timeline은 **BLOCKS 방향(source=선행, target=후행)만** 반환해 간트 화살표 1개로 그린다(BLOCKED_BY는 그 역이므로 생략). RELATES_TO/DUPLICATES는 의존성이 아니므로 제외.
> - **매퍼**: `ViewMapper.timelineLinks(projectId)` 신규 — `work_item_links l JOIN work_items s ON l.source_id=s.id JOIN work_items t ON l.target_id=t.id WHERE s.project_id=#{id} AND l.link_type='BLOCKS' AND s.deleted_at IS NULL AND t.deleted_at IS NULL`. items와 동일 프로젝트/가시성 범위.
> - **막대 드래그 저장**: start/due 변경은 **기존 `PATCH /work-items/{id}`**(startDate/dueDate) 재사용 — 신규 엔드포인트 없음. VIEWER는 CR-031 가드로 이미 403(쓰기 차단), FE는 SVAR `readonly`로 UI 비활성.
> - **크리티컬 패스**: BE 미계산. FE가 items+links로 **순수함수(위상정렬+최장경로)** 파생 — 드래그 시 즉시 재계산. BE 응답 무변경(계산 결과를 싣지 않음).
> - **에러코드·스키마 무변경**: work_item_links 기존 테이블 재사용. 신규 마이그레이션 없음.

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET | /dashboard/blocked | 막힌 업무 목록(BLOCKED) | 🔒 | P1 | WMP-HOME-001·002 |
| GET | /dashboard/delayed | 지연 업무 목록(기한 초과 미완료, POL-002) | 🔒 | P1 | WMP-HOME-002 |
| GET | /dashboard/unassigned | 미배정 업무 목록(담당자 없음) | 🔒 | P1 | WMP-HOME-002 |
| GET | /dashboard/metrics | 지표 카드(진행/오늘마감/이번주/미배정/장기미변경) | 🔒 | P1 | WMP-HOME-001 |
| GET | /projects/{id}/report | 프로젝트 보고서(진행률/지연/막힘/담당자 부하) | 🔒 | P1 | WMP-HOME-003 |

> 회사홈 집계는 가시성(WMP-WS-006/BIZ-108) 반영 — 볼 수 있는 프로젝트만 집계.

## K. 관리자 마스터 (Admin)

> 마스터 데이터로 관리(하드코딩 금지). 시스템 시드 제공. `is_system=true`는 삭제 불가.

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET·POST·PUT·DELETE | /admin/measure-units | 측정 단위 마스터 CRUD | 🔒 Admin | P1 | WMP-ADM-001 |
| GET·POST·PUT·DELETE | /admin/field-schemes | 필드 스킴(유형/프로젝트별 표시 on/off) CRUD | 🔒 Admin | P1 | WMP-ADM-002 |
| GET·POST·PUT·DELETE | /admin/workflows | 워크플로 CRUD(상태/전이 화이트리스트 포함) | 🔒 Admin | P1 | WMP-ADM-003 |
| GET·POST·PUT·DELETE | /admin/workflows/{id}/statuses | 워크플로 상태 편집 | 🔒 Admin | P1 | WMP-ADM-003 |
| GET·POST·DELETE | /admin/workflows/{id}/transitions | 전이(화이트리스트) 편집 | 🔒 Admin | P1 | WMP-ADM-003 |
| GET·POST·PUT·DELETE | /admin/issue-types | 업무 유형 마스터 CRUD(5종 기본 삭제 불가) | 🔒 Admin | P2 | WMP-ADM-004 |
| GET·POST·PUT·DELETE | /admin/forms | 양식 빌더 CRUD | 🔒 Admin | P2 | WMP-ADM-005 |

## L. 알림 (Notifications)

| 메서드 | 경로 | 설명 | 인증 | 우선순위 | 관련 기능ID |
|--------|------|------|------|----------|-------------|
| GET | /notifications | 알림 목록(읽음/안읽음) | 🔒 | P1 | WMP-NOTI-001 |
| GET | /notifications/unread-count | 안읽음 개수(배지) | 🔒 | P1 | WMP-NOTI-001 |
| PATCH | /notifications/{id}/read | 알림 읽음 처리 | 🔒 | P1 | WMP-NOTI-001 |
| GET | /inbox | 받은함(내게 온 것 통합 — 목록 + 안읽음 배지) | 🔒 | P1 | WMP-NOTI-001 |
| GET | /notification-preferences | 내 알림 수신 설정 목록(종류×채널, 미설정은 기본값 머지) | 🔒 | P1 | WMP-NOTI-003 (CR-028) |
| PUT | /notification-preferences | 수신 설정 일괄 upsert(종류별 in_app/email/push) | 🔒 | P1 | WMP-NOTI-003 (CR-028) |
| POST | /fcm/token | 내 FCM 기기 토큰 등록(로그인 시) | 🔒 | P1 | WMP-NOTI-004 (CR-028) |
| DELETE | /fcm/token | 내 FCM 기기 토큰 삭제(로그아웃 시) | 🔒 | P1 | WMP-NOTI-004 (CR-028) |

> 알림 트리거 발행(WMP-NOTI-002)은 도메인 이벤트(ApplicationEvent) 기반 내부 처리 — 외부 엔드포인트 아님(T1-6 이벤트 계약).
> **받은함(/inbox) 구현 메모(CR-011)**: 배정·멘션·마감·막힘은 이미 `notifications.type`으로 **통합 수신**된다(T1-1 WMP-NOTI-001 "내게 온 것 통합"). 별도 소스를 런타임 합산하는 별도 테이블이 아니라, `/notifications` 목록을 **받은함 응답(items + unreadCount 배지)**으로 한 번에 제공하는 별칭이다. 데이터 소스는 `NotificationService.list()`/`unreadCount()` 재사용(신규 매퍼 없음).
>
> **수신 설정(CR-028) 요청/응답**:
> - `GET /notification-preferences` → `{ items: [{ type, inApp, email, push }] }`. 서버가 전체 알림 종류 목록 × 기본값을 베이스로 깔고, 저장된 행을 머지해 반환(클라가 어떤 종류가 있는지 알 필요 없음).
> - `PUT /notification-preferences` body `{ items: [{ type, inApp, email, push }] }` → 보낸 종류만 upsert(부분 갱신). 인증 사용자 본인 것만. in_app=false여도 받은함 원장 기록은 유지(표시/배지만 숨김).
> - `POST /fcm/token` body `{ fcmToken, deviceInfo? }`(userId는 토큰에서) → 자체 `fcm_tokens` 저장 + bp-notification `POST /api/v1/fcm/token` 미러 위임(best-effort). `DELETE /fcm/token` body `{ fcmToken }`.
>
> **외부 전달(WMP-NOTI-004)**: 인앱 알림 생성 후 `NotificationDispatcher`가 수신자 설정을 보고 email/push가 ON인 종류만 bp-notification(`POST /api/v1/messages/email`·`/push`)으로 fan-out. `X-API-Key`(solutionCode `WMP`) + 종류별 템플릿코드(`WMP_NOTI_{TYPE}`) + variables(workItemKey/title/projectName/actorName/link). best-effort 비동기 — 발송 실패가 인앱 기록/트랜잭션을 막지 않음.

---

## 작성 원칙
- 경로: kebab-case, 복수 명사. 행위는 `POST/PATCH /{resource}/{id}/{action}`.
- 인증: 🔒 / 역할 제한은 🔒 Admin·🔒 Manager.
- 상태 변경은 반드시 FSM 가드 경유(BIZ-010). 직접 status UPDATE 금지.
- Request/Response Body는 작성하지 않음 — 구현 시 T3-1 데이터 모델에서 도출.
- 목록 엔드포인트는 `PageResponse` + `SearchConditionRequest` 필터 규격 사용.
- 측정·진행률 등 정량/정성 값은 측정 추상화(measure_unit + target/current)로 일원화(WMP-WI-016).
