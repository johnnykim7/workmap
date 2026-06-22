# WorkMap CHANGELOG

본 프로젝트의 변경 내역. 기능/설계 변경의 상세는 `docs/CR_변경_이력.md` 참조.

## [v1.0-design] - 2026-06-19

### 추가
- AI-SDLC 방법론(v2.26.0) 기반 설계 산출물 생성 (CR-000)
  - T1-1~T1-8 (요구사항·규칙·정책·FSM·이벤트·Sprint·시스템 가이드)
  - T2-1 기술 스택 결정서, CLAUDE.md, `.claude/hooks/enforce-workflow.sh`, `.claude/settings.json`
  - T3-1 데이터 모델, T3-2 API 설계, T3-3 화면 구조(IA), T3-5 단위테스트 명세
  - execution-spec.md (Claude Code 구현 진입점)
  - 원본 요구사항 보관(docs/origins/)
- 구현 범위: Phase 1(Sprint 1~5). Phase 2~4 청사진 보존.

### 변경
- BE DB를 PostgreSQL 16으로 확정 (CR-001). ORM은 MyBatis 유지(JPA 금지).

### 기술 스택
- BE: Spring Boot 3 + Java 17 + MyBatis + PostgreSQL 16 + bp-common-lib 0.1.0
- FE: React 19 + Vite + TypeScript + @therecommerce/ds-ui + TanStack Query + Zustand
- 레포: 모노레포(backend/ + frontend/)
