# WorkMap E2E UX 피드백 누적

> **목적**: 사용자가 직접 운영 화면을 E2E로 돌면서 발견한 불편·디자인·UX·버그를 한곳에 누적.
> **규칙**: 던진 항목은 **즉시 수정하지 않는다.** 여기 기록만 하고, 사용자가 "수정하자" 하면 모아서 일괄 수정.
> 시작: 2026-06-27 | 환경: 운영 (FE nginx `/home/therecommerce/workmap/frontend/`, BE 8186)

---

## 작성 규칙
- 한 항목 = 한 행. 사용자가 말한 그대로 + (필요 시) 화면/기능ID 보강.
- **상태**: 🆕 신규 / 🔧 수정중 / ✅ 수정완료 / ❌ 보류·기각
- **유형**: `디자인` (색/간격/정렬/톤) · `UX` (흐름/문구/동작/피드백) · `버그` (동작 안 함/에러) · `기능` (없는 기능 요청)
- **우선순위**: H(즉시) / M(보통) / L(나중)

---

## 피드백 목록

| # | 상태 | 화면 / 기능ID | 유형 | 우선 | 내용 (사용자 발언) | 수정 방향 (작성자 메모) |
|---|------|--------------|------|------|--------------------|------------------------|
| 1 | 🆕 | 로그인 / WMP-AUTH-001 | UX | M | "회원가입은 어디서 하나요?" — 로그인 화면에 가입 진입점도, 가입 불가 안내도 없어 혼란 | 설계상 self-signup 부재(WMP-AUTH-004 관리자 초대 모델). 로그인 화면에 안내 문구 추가 검토(예: "계정은 관리자에게 요청하세요"). 가입 화면 신설은 아님 |
| 2 | 🆕 | 회사 홈 / WMP-HOME-001 | 디자인 | M | "미배정 업무 카드의 라인 등이 좀 진한 색임. 자연스러운 색깔로 변경" | 미배정 업무 카드의 행 구분선(border)이 좌측 막힌/지연 업무 카드보다 진함. 세 카드 구분선 톤 통일 — ds-ui 기본 border 토큰(연한 회색)으로. CLAUDE.md "색 절제·중립 톤" 규칙 부합 |
| 3 | 🆕 | 회사 홈 / 공통 레이아웃 | 디자인 | M | (스샷 관찰) 우상단 "관리자" 버튼이 가로 폭에 잘려 "관" 한 글자만 보임 | 헤더 우측 버튼 영역 폭/줄임 처리 점검. "만들기"·"관리자" 버튼 정렬·여백 확인. 좁은 폭에서도 라벨 안 잘리게 |
| 4 | 🆕 | 업무 상세 / WMP-WI-004 | UX | M | "상세 화면 들어갔을 때 뒤로 가기 같은 버튼이 없음" | 상세 진입 후 목록/이전 화면으로 복귀하는 명시적 버튼 부재. 상단 좌측에 ← 뒤로 가기(또는 ✕ 닫기) 추가. 현재 DEMO-2 옆 위/아래 화살표는 항목 이동용이라 별개. 모달 진입인지 라우트 진입인지에 따라 닫기 vs 뒤로 동작 결정 |
| 5 | 🆕 | 업무 상세 / WMP-WI-008 | 디자인 | M | "세부 사항에서 시작일/기한 우측 디자인 정렬이 깨짐" | 세부 사항 패널의 시작일·기한(DatePicker) 입력 필드가 패널 폭을 넘어 우측이 잘림. 위쪽 담당자/보고자/우선순위 셀렉트는 패널 안에 맞음. DatePicker width를 다른 필드와 동일(w-full/패널 내부 맞춤)하게. 날짜 두 필드만 고정폭/overflow 의심 |
| 6 | 🆕 | 업무 상세 / WMP-WI-008 (DatePicker) | UX | M | "달력을 클릭하면 선택되고 사라지는 게 맞을지 검토 필요. 현재는 사라지지 않고 여백을 클릭해야 사라짐" | 단일 날짜 선택 시 선택 즉시 팝오버 close가 통상 패턴. 다만 ds-ui DatePicker 기본 동작 확인 필요(onSelect→close 옵션 유무). 시작일/기한 같은 단일선택은 자동 닫힘으로, 범위선택은 예외 — 일괄 수정 전 동작 정책 먼저 확정 |
| 7 | ✅ | 전역 [만들기] / **WMP-WI-001** | **버그(기능누락)** | **H** | "업무 만들기 누르면 'Sprint3에서 구현됩니다' stub가 뜸. Sprint3은 이미 구현 완료 아닌가?" | **[수정완료 2026-06-27]** [create-modal.tsx](frontend/src/components/common/create-modal.tsx) stub → 실제 생성 폼 교체. `POST /work-items`(BE CreateRequest 계약) 연결: 필수=프로젝트·유형·요약 / 선택=설명·담당자·우선순위·라벨·Epic(§9.4 "만들기는 가볍게"). 유형은 프로젝트 템플릿 issueTypeCodes로 좁힘, 담당자=프로젝트 멤버, Epic=프로젝트 내 EPIC 항목. `[ ] 다른 항목 만들기` 연속 생성. `features/workitem/api.ts`에 `create` + `hooks.ts`에 `useCreateWorkItem` 추가. ds-ui Dialog+RHF+Zod. tsc+vite build 통과, api 계약 테스트 8/8 PASS. **함께 처리된 FE 미연결 3종**: WS-001(워크스페이스 생성/수정)·WS-004(프로젝트 수정/보관)·WS-006(가시성 변경) — ProjectsPage 헤더/카드 메뉴·SummaryView 설정 버튼·ProjectSettingsDialog로 연결. |
| 8 | 🆕 | 업무 상세 헤더 / (53종 밖) | UX | L | (스캔 중 발견) 상세 헤더의 "구독(워치)" 버튼 클릭 시 "워치 기능은 준비 중입니다" 토스트만 — 동작 없음 ([DetailHeader.tsx:90](frontend/src/features/workitem/components/DetailHeader.tsx#L90)) | 워치/구독은 T1-1 53종에 없는 기능(알림 트리거 WMP-NOTI-002와 별개). 버튼을 노출하면서 "준비 중" 토스트만 띄우면 미완성 인상. → 버튼 숨기거나, 기능 정식 추가는 Phase 재검토. 우선 L |
| 9 | 🆕 | 검색 인풋 전반 / ds-ui SearchInput | 버그(배포) | M | "인풋박스에 아이콘이 있는 경우 글자와 겹치는 케이스가 있음" (스샷: 프로젝트 필터바 "프로젝트명·키 검색" — 돋보기 아이콘과 placeholder 겹침) | **[코드+운영 CSS 실측됨]** 코드 버그 아님 — **운영 배포가 구버전 CSS임.** ds-ui [SearchInput](frontend/node_modules/@therecommerce/ds-ui/dist/index.js#L2672)은 아이콘 `left-3`+input `pl-9`로 겹침 방지 설계가 정상(twMerge 머지·`--spacing:.25rem` 정의 확인). 그러나 운영 `index-C7wRzaPA.css`(58KB)에는 `.pl-9`/`.pr-8`/`--spacing`이 **전혀 없음** — 로컬 최신 dist CSS(134KB, `index-CsEzL5Cq.css`)엔 모두 포함. 운영 JS 해시도 로컬과 불일치(운영 `index-B5IStAhX.js` vs 로컬 `index-Def-j4bc.js`). **결론: SearchInput 쓰는 전 화면(프로젝트/업무목록/멤버/검색/링크/유저관리) 공통 영향. 코드 수정 불필요 — `nvm use 22 && ./deploy.sh fe` 재배포로 해소.** 일괄 수정 시 "배포로 해결" 트랙으로 분류. |
| 10 | 🆕 | 관리자 테이블 전반 / ds-ui Table (스샷=측정단위 WMP-ADM-001) | 기능 | L | "이 테이블이 ds-ui 컴포넌트인가? 페이징/정렬/드래그 리사이즈/인라인 편집이 있나?" | **[코드 실측됨]** ① 테이블=**ds-ui 정식** `Table/TableHeader/TableBody/TableRow/TableHead/TableCell` ([MeasureUnitsPage.tsx:6-7](frontend/src/pages/admin/MeasureUnitsPage.tsx#L6), 임시 `<table>` 아님). ② 페이징=**있음**, 단 ds-ui `Pagination`이 아니라 Button 2개 자체 prev/next([130-140줄](frontend/src/pages/admin/MeasureUnitsPage.tsx#L130), 번호점프 없음·`totalPages>1`일 때만 노출). ③ 컬럼정렬(헤더 클릭 sort)=**없음** ("정렬" 컬럼은 데이터 `sortOrder` 표시값일 뿐). ④ 컬럼 드래그 리사이즈=**없음**(폭 `w-20/w-28` 고정, ds-ui Table 미지원). ⑤ 인라인 편집=**없음**(행 [수정]→`MeasureUnitDialog` 모달). **결론(사용자 방향 확정): 이 기능들은 WorkMap에서 화면별로 자체 구현하지 않는다 — 필요하면 ds-ui Table에 sort/resize/inline-edit/Pagination을 넣고 전 프로젝트가 공유한다(조직 공통 컴포넌트 재사용 원칙). WorkMap 단독 수정 대상 아님 → ds-ui 개선 백로그로 분리.** 우선 L. |

---

## 일괄 수정 로그
> "수정하자" 지시 후, 위 항목을 묶어 처리한 기록. (수정 커밋·범위·검증 결과)

### 2026-06-27 — FE 미연결 4종 연결 (#7 포함)
- **범위**: BE 엔드포인트는 있으나 FE 진입점·호출이 없던 4종을 연결(신규 BE 없음, BE 계약 코드 실측 후 맞춤).
  - **WMP-WI-001 업무 생성**: create-modal stub → 실제 생성 폼(`POST /work-items`). #7 해소.
  - **WMP-WS-001 워크스페이스 생성/수정**: `POST·PATCH /workspaces` + ProjectsPage 헤더/필터바 진입(Admin·Owner).
  - **WMP-WS-004 프로젝트 수정/보관**: `PATCH /projects/{id}`·`/archive` + ProjectSettingsDialog(Manager 이상).
  - **WMP-WS-006 가시성 변경**: `PATCH /projects/{id}/visibility` + 설정 다이얼로그 내 공개/비공개 토글.
- **진입점**: 전역 [만들기] 모달 / ProjectsPage 헤더·워크스페이스 수정줄 / ProjectCard 우상단 메뉴 / SummaryView 헤더 설정 버튼.
- **검증**: `tsc -b` + `vite build`(3400 modules) 통과 · 4종 api 계약 테스트 8/8 PASS(node 환경 fetch 스텁). 운영 화면 E2E는 별도(배포 후).
- **UI 규칙 준수**: ds-ui만 사용(네이티브 alert/confirm/select/date 없음). 생성/저장=primary, 취소=ghost, 보관(파괴)=destructive+공통 ConfirmDialog.
