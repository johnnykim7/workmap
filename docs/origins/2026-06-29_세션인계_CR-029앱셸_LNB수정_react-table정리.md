# 세션 인계 — CR-029 App Shell + LNB 수정 + react-table 정리 (2026-06-29)

> 이 세션의 주 작업 = **CR-029 모바일 앱(Capacitor) App Shell 구현**.
> 도중 LNB 클릭 회귀를 발견·수정, react-table 군더더기를 ds-ui 0.3.0으로 정리.
> **운영 FE 배포는 react-table 설치 시점(0c44ba3)까지만** 됨 — 이후 3커밋 미배포.

---

## 1. 완료 (커밋됨, develop)

| 커밋 | 내용 |
|------|------|
| `1cea4c4` | CR-029 설계 캐스케이드 (T1-1 모듈 J·execution-spec §CR-029·T3-3·CR이력) |
| `0c44ba3` | mock 계정 @workmap.com 통일 + react-table 임시 설치 |
| `43c2577` | **CR-029 App Shell 구현** (Capacitor 8.4.1·config·api-client 분기·스크립트·ios/android 76파일) |
| `cefb431` | CLAUDE.md 진행상태 |
| `4859a04` | react-table 제거 (ds-ui 0.3.0 data-grid 분리로 불필요) |

### App Shell 핵심 (WMP-APP-001)
- `@capacitor/core·cli·ios·android` **8.4.1** (push/camera/voice는 후속 CR — 설계만 선기재 WMP-APP-002~004)
- `frontend/capacitor.config.ts`: appId=`com.therecommerce.workmap`, webDir=`dist`, allowNavigation=[`59.8.160.12`], cleartext, SplashScreen
- `frontend/src/lib/api-client.ts`: `Capacitor.isNativePlatform()`이면 운영BE 절대URL(`http://59.8.160.12:8186/api/v1`), 웹은 기존 `/api/v1`
- package.json: `build:mobile·sync·sync:ios·sync:android·open:ios·open:android`
- `ios/`·`android/` 네이티브 프로젝트 생성됨(빌드 산출물은 자체 .gitignore 제외, 설정 72파일만 커밋)
- 빌드(tsc+vite) 통과, `cap sync` 반영 확인

---

## 2. ⏭️ 인계 — 해야 할 일

### A. 운영 FE 재배포 (미수행)
- **마지막 배포 = `0c44ba3` 시점**(react-table 설치·ds-ui 0.2.x). 이후 `43c2577·cefb431·4859a04` 미배포.
- 재배포하면: ds-ui **0.3.0 dist**(LNB linkComponent 수정 + data-grid 분리) + App Shell(웹 무영향) + react-table 제거가 운영 반영됨.
- 절차: 다른 세션 미커밋(테마·chat) **stash → `CI=true ./deploy.sh fe`(nvm use 22) → stash 복구**.
- ⚠️ **배포 후 운영 LNB 표시 필수 확인** — ds-ui 0.2.x→0.3.0으로 `dist/style.css` 바뀌어 LNB 사라짐 함정 가능([[workmap-tailwind-lnb-trap]]).

### B. 시뮬레이터 실기동 (App Shell 최종 검증, 미수행)
```bash
cd frontend && nvm use 22
pnpm sync:ios && pnpm open:ios   # Xcode ▶ (또는 open:android)
```
→ WorkMap 뜨고 `admin@workmap.com / admin1234`(운영) 로그인되면 App Shell OK.
- Xcode 16.1·Android SDK·시뮬레이터 확인됨. 코드사이닝 미설정일 수 있음(개발용 자동서명).

### C. ds-ui (design-system 레포 — 담당자 몫, 이 레포 밖)
- **LNB 수정**: `packages/ui/src/.../AdminShell.tsx` linkComponent 복원(소스 변경) — 0.3.0에 포함됨. patch=`/tmp/ds-ui-adminshell-linkcomponent-restore.patch`, 전달문서=`/tmp/ds-ui-adminshell-linkcomponent-전달.md`.
- **0.3.0 GitHub Packages publish** — 승인 대기(다른 세션 흐름).
- WorkMap은 현재 `file:` 로컬 링크(0.3.0 dist)를 봄. publish 후 GitHub Packages로 전환하려면 package.json `"@therecommerce/ds-ui": "file:..."` → `"^0.3.0"` 변경 + 재설치(팀 결정사항).

### D. CR-029 후속 (별도 CR)
- WMP-APP-002 푸시: `@capacitor/push-notifications` → 기존 BE `POST /api/v1/fcm/token`(CR-028) 연결. 단 Firebase 프로젝트·APNs 키 미보유.
- WMP-APP-003 카메라: `@capacitor/camera` → 기존 `/files/upload`(CR-024).
- WMP-APP-004 음성: 녹음/STT 플러그인. 상세는 execution-spec §CR-029.

---

## 3. working tree 주의 (다른 세션 작업 섞여 있음 — 건드리지 말 것)

이 세션이 **안 만든** 미커밋 변경 (테마·chat 세션 것):
- 테마: `App.tsx`·`route-paths.ts`·`main.tsx`·`AppShell.tsx`·`themes.ts`·`themes.test.ts`·`theme-store.ts`·`AccountThemePage.tsx`·`main.css`(시반 다크테마)
- chat: `ChannelDialogs.tsx`·`MessageItem.tsx`·`MessagePane.tsx`·`rich-text-editor.css`

→ 배포·커밋 시 **내 App Shell 커밋만** 다루고 이 변경은 stash로 분리. (이 세션 내내 그렇게 처리함.)

---

## 4. 배경 사실 (react-table 왜 넣었다 뺐나)
- ds-ui 단일번들 배럴이 DataGrid→`@tanstack/react-table`을 정적 import. WorkMap엔 미설치 → Vite optional-peer named import 빌드 깨짐(`flexRender not exported`).
- 1차 = WorkMap에 react-table 설치(임시). **근본 = ds-ui 0.3.0이 DataGrid/TableSection/InboundList를 `/data-grid` 서브패스로 분리** → 기본 import 무의존 → WorkMap react-table 제거(`4859a04`).
- WorkMap은 DataGrid 미사용(import 0건)이라 제거가 정답.

상세: 메모리 [[workmap-mobile-app]] · [[workmap-tailwind-lnb-trap]]
