-- WorkMap V2 시드 (T3-1 "Flyway 시드", T1-5 워크플로 정의 — CR-006 v0.4)
-- 시스템 기본 마스터: issue_type / workflow(3종)+status+transition / measure_unit / project_template / field_scheme
-- ID는 GENERATED ALWAYS이므로 code/name 서브쿼리로 FK 연결한다.

-- =====================================================================
-- 1) issue_type — EPIC/STORY/TASK/BUG/SUBTASK (is_system, depth 0/1/1/1/2)
-- =====================================================================
INSERT INTO issue_type (code, label, depth, color, icon, is_system, sort_order) VALUES
  ('EPIC',    '에픽',    0, 'purple', 'epic',    true, 1),
  ('STORY',   '스토리',  1, 'green',  'story',   true, 2),
  ('TASK',    '작업',    1, 'blue',   'task',    true, 3),
  ('BUG',     '버그',    1, 'red',    'bug',     true, 4),
  ('SUBTASK', '하위작업', 2, 'gray',   'subtask', true, 5);

-- =====================================================================
-- 2) workflow + status + transition (3종, T1-5)
-- =====================================================================
INSERT INTO workflow (name, is_system) VALUES
  ('개발형',     true),
  ('운영형',     true),
  ('현장검증형', true);

-- ── 2-1) 개발형: TODO → SELECTED → IN_PROGRESS → IN_REVIEW → DONE ──
INSERT INTO workflow_status (workflow_id, code, label, common_status, is_start, is_done, sort_order)
SELECT w.id, v.code, v.label, v.common_status, v.is_start, v.is_done, v.sort_order
FROM workflow w,
  (VALUES
    ('TODO',        '할 일',              'TODO',        true,  false, 1),
    ('SELECTED',    '개발하기로 선택됨',  'TODO',        false, false, 2),
    ('IN_PROGRESS', '진행 중',            'IN_PROGRESS', false, false, 3),
    ('IN_REVIEW',   '검토 중',            'IN_REVIEW',   false, false, 4),
    ('DONE',        '완료',               'DONE',        false, true,  5)
  ) AS v(code, label, common_status, is_start, is_done, sort_order)
WHERE w.name = '개발형';

INSERT INTO workflow_transition (workflow_id, from_status_id, to_status_id)
SELECT fs.workflow_id, fs.id, ts.id
FROM workflow_status fs
JOIN workflow_status ts ON ts.workflow_id = fs.workflow_id
JOIN workflow w ON w.id = fs.workflow_id AND w.name = '개발형'
WHERE (fs.code, ts.code) IN (
    ('TODO','SELECTED'), ('TODO','IN_PROGRESS'),
    ('SELECTED','IN_PROGRESS'), ('SELECTED','TODO'),
    ('IN_PROGRESS','IN_REVIEW'), ('IN_PROGRESS','DONE'),
    ('IN_REVIEW','DONE'), ('IN_REVIEW','IN_PROGRESS'),
    ('DONE','IN_PROGRESS')
);

-- ── 2-2) 운영형: RECEIVED → CHECKING → PROCESSING → FIELD_CHECK → DONE / HOLD ──
INSERT INTO workflow_status (workflow_id, code, label, common_status, is_start, is_done, sort_order)
SELECT w.id, v.code, v.label, v.common_status, v.is_start, v.is_done, v.sort_order
FROM workflow w,
  (VALUES
    ('RECEIVED',    '접수',     'TODO',        true,  false, 1),
    ('CHECKING',    '확인 중',  'IN_PROGRESS', false, false, 2),
    ('PROCESSING',  '처리 중',  'IN_PROGRESS', false, false, 3),
    ('FIELD_CHECK', '현장확인', 'IN_REVIEW',   false, false, 4),
    ('DONE',        '완료',     'DONE',        false, true,  5),
    ('HOLD',        '보류',     'HOLD',        false, false, 6)
  ) AS v(code, label, common_status, is_start, is_done, sort_order)
WHERE w.name = '운영형';

INSERT INTO workflow_transition (workflow_id, from_status_id, to_status_id)
SELECT fs.workflow_id, fs.id, ts.id
FROM workflow_status fs
JOIN workflow_status ts ON ts.workflow_id = fs.workflow_id
JOIN workflow w ON w.id = fs.workflow_id AND w.name = '운영형'
WHERE (fs.code, ts.code) IN (
    ('RECEIVED','CHECKING'), ('RECEIVED','HOLD'),
    ('CHECKING','PROCESSING'), ('CHECKING','HOLD'),
    ('PROCESSING','FIELD_CHECK'), ('PROCESSING','DONE'), ('PROCESSING','HOLD'),
    ('FIELD_CHECK','DONE'), ('FIELD_CHECK','PROCESSING'),
    ('HOLD','CHECKING'), ('HOLD','PROCESSING'),
    ('DONE','PROCESSING')
);

-- ── 2-3) 현장검증형: TODO → IN_PROGRESS → DEV_DONE → FIELD_VERIFYING → OPS_APPLIED ──
INSERT INTO workflow_status (workflow_id, code, label, common_status, is_start, is_done, sort_order)
SELECT w.id, v.code, v.label, v.common_status, v.is_start, v.is_done, v.sort_order
FROM workflow w,
  (VALUES
    ('TODO',            '할 일',        'TODO',        true,  false, 1),
    ('IN_PROGRESS',     '진행 중',      'IN_PROGRESS', false, false, 2),
    ('DEV_DONE',        '개발완료',     'IN_PROGRESS', false, false, 3),
    ('FIELD_VERIFYING', '현장검증중',   'IN_REVIEW',   false, false, 4),
    ('OPS_APPLIED',     '운영반영완료', 'DONE',        false, true,  5)
  ) AS v(code, label, common_status, is_start, is_done, sort_order)
WHERE w.name = '현장검증형';

INSERT INTO workflow_transition (workflow_id, from_status_id, to_status_id)
SELECT fs.workflow_id, fs.id, ts.id
FROM workflow_status fs
JOIN workflow_status ts ON ts.workflow_id = fs.workflow_id
JOIN workflow w ON w.id = fs.workflow_id AND w.name = '현장검증형'
WHERE (fs.code, ts.code) IN (
    ('TODO','IN_PROGRESS'),
    ('IN_PROGRESS','DEV_DONE'),
    ('DEV_DONE','FIELD_VERIFYING'), ('DEV_DONE','IN_PROGRESS'),
    ('FIELD_VERIFYING','OPS_APPLIED'), ('FIELD_VERIFYING','IN_PROGRESS'),
    ('OPS_APPLIED','FIELD_VERIFYING')
);

-- =====================================================================
-- 3) measure_unit — 건수/금액/퍼센트/시간/완료여부/리드타임/SLA
-- =====================================================================
INSERT INTO measure_unit (name, value_type, suffix, options, is_system, sort_order) VALUES
  ('건수',     'NUMBER',  '건',   NULL, true, 1),
  ('금액',     'NUMBER',  '원',   NULL, true, 2),
  ('퍼센트',   'NUMBER',  '%',    NULL, true, 3),
  ('시간',     'NUMBER',  '시간', NULL, true, 4),
  ('완료여부', 'BOOLEAN', NULL,   NULL, true, 5),
  ('리드타임', 'NUMBER',  '일',   NULL, true, 6),
  ('SLA',      'SELECT',  NULL,   '["달성","부분달성","미달"]'::jsonb, true, 7);

-- =====================================================================
-- 4) project_template — DEV/OPS/PLAN (시드 예시, is_system)
--    default_workflow_id는 위 워크플로 행 참조
-- =====================================================================
INSERT INTO project_template (code, name, description, icon, default_tabs, default_workflow_id, issue_type_codes, is_system, sort_order)
SELECT 'DEV', '개발형', '개발 프로젝트(백로그·스프린트·보드 중심)', 'dev',
       '["backlog","board","timeline","list","issues"]'::jsonb,
       (SELECT id FROM workflow WHERE name = '개발형'),
       '["EPIC","STORY","TASK","BUG","SUBTASK"]'::jsonb, true, 1
UNION ALL
SELECT 'OPS', '운영형', '운영·고객대응(접수·처리·보류 워크플로)', 'ops',
       '["board","list","issues"]'::jsonb,
       (SELECT id FROM workflow WHERE name = '운영형'),
       '["TASK","BUG","SUBTASK"]'::jsonb, true, 2
UNION ALL
SELECT 'PLAN', '계획형', '계획·경영공통(타임라인·목록 중심)', 'plan',
       '["timeline","list","board"]'::jsonb,
       (SELECT id FROM workflow WHERE name = '현장검증형'),
       '["EPIC","STORY","TASK"]'::jsonb, true, 3;

-- =====================================================================
-- 5) field_scheme — 전역 기본(project_id NULL) 유형별 표시 필드 (§8.3)
-- =====================================================================
INSERT INTO field_scheme (project_id, issue_type_code, field_key, is_visible, is_required, sort_order) VALUES
  -- STORY
  (NULL, 'STORY', 'acceptance_criteria', true, false, 1),
  (NULL, 'STORY', 'story_points',        true, false, 2),
  -- BUG
  (NULL, 'BUG', 'steps_to_reproduce', true, true,  1),
  (NULL, 'BUG', 'expected_result',    true, false, 2),
  (NULL, 'BUG', 'actual_result',      true, false, 3),
  (NULL, 'BUG', 'environment',        true, false, 4),
  (NULL, 'BUG', 'severity',           true, true,  5),
  -- TASK
  (NULL, 'TASK', 'checklist',      true, false, 1),
  (NULL, 'TASK', 'estimate_hours', true, false, 2),
  -- EPIC
  (NULL, 'EPIC', 'measure_unit_id', true, false, 1),
  (NULL, 'EPIC', 'target_value',    true, false, 2);
