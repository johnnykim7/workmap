-- =====================================================================
-- V6 — 탭 메뉴(Jira식): 라벨 DB화 + 프로젝트별 이름 + 기본탭 (CR-020)
-- T3-1 Flyway V6 / T3-2 / T3-3 §9.1
-- active_tabs(코드 배열)는 구조 무변경. 라벨/기본탭만 추가.
-- =====================================================================

-- ── 1) tab_def — 전역 기본 탭 정의(코드 상수 PROJECT_TAB_LABEL DB화) ──
CREATE TABLE tab_def (
    code        VARCHAR(30) PRIMARY KEY,
    label       VARCHAR(60) NOT NULL,
    icon        VARCHAR(40),
    sort_order  INT         NOT NULL DEFAULT 0
);

INSERT INTO tab_def (code, label, icon, sort_order) VALUES
  ('summary',   '요약',     'summary',   1),
  ('list',      '목록',     'list',      2),
  ('board',     '보드',     'board',     3),
  ('backlog',   '백로그',   'backlog',   4),
  ('timeline',  '타임라인', 'timeline',  5),
  ('calendar',  '캘린더',   'calendar',  6),
  ('approvals', '승인',     'approvals', 7),
  ('reports',   '보고서',   'reports',   8);

-- ── 2) project_tab_label — 프로젝트별 이름 오버라이드(sparse) ──
--     기본값과 다른 것만 저장. 행 없으면 tab_def로 폴백. 되돌리기=DELETE.
CREATE TABLE project_tab_label (
    project_id  BIGINT      NOT NULL,
    tab_code    VARCHAR(30) NOT NULL,
    label       VARCHAR(60) NOT NULL,
    PRIMARY KEY (project_id, tab_code)
);

-- ── 3) projects.default_tab — "기본값으로 설정"한 진입 탭 ──
--     NULL이면 summary(또는 active_tabs 첫 탭) 폴백.
ALTER TABLE projects ADD COLUMN default_tab VARCHAR(30);
