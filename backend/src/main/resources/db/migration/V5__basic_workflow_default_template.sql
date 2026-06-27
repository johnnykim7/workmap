-- =====================================================================
-- V5 — 범용 워크플로(BASIC) + 디폴트 템플릿(DEFAULT) + 탭 정합 보정 (CR-019)
-- T1-5 §4 / T3-1 Flyway V5 / T3-3 §9.1
-- =====================================================================

-- ── 1) 범용 워크플로(BASIC): TODO → IN_PROGRESS → DONE (되돌리기/재개 역전이) ──
INSERT INTO workflow (name, is_system) VALUES ('범용형', true);

INSERT INTO workflow_status (workflow_id, code, label, common_status, is_start, is_done, sort_order)
SELECT w.id, v.code, v.label, v.common_status, v.is_start, v.is_done, v.sort_order
FROM workflow w,
  (VALUES
    ('TODO',        '할 일',   'TODO',        true,  false, 1),
    ('IN_PROGRESS', '진행 중', 'IN_PROGRESS', false, false, 2),
    ('DONE',        '완료',    'DONE',        false, true,  3)
  ) AS v(code, label, common_status, is_start, is_done, sort_order)
WHERE w.name = '범용형';

INSERT INTO workflow_transition (workflow_id, from_status_id, to_status_id)
SELECT fs.workflow_id, fs.id, ts.id
FROM workflow_status fs
JOIN workflow_status ts ON ts.workflow_id = fs.workflow_id
JOIN workflow w ON w.id = fs.workflow_id AND w.name = '범용형'
WHERE (fs.code, ts.code) IN (
    ('TODO','IN_PROGRESS'),
    ('IN_PROGRESS','DONE'), ('IN_PROGRESS','TODO'),
    ('DONE','IN_PROGRESS')
);

-- ── 2) #14 정합 보정: 기존 3종 default_tabs를 route-paths 실존 8탭 기준으로 교정 ──
--     유령 값 'issues' 제거, 누락 summary/reports 보강. FE 상수와 일치(BE 시드가 정본).
UPDATE project_template
   SET default_tabs = '["summary","backlog","board","timeline","reports"]'::jsonb
 WHERE code = 'DEV';
UPDATE project_template
   SET default_tabs = '["summary","board","list","calendar","approvals","reports"]'::jsonb
 WHERE code = 'OPS';
UPDATE project_template
   SET default_tabs = '["summary","timeline","reports"]'::jsonb
 WHERE code = 'PLAN';

-- ── 3) 디폴트 템플릿(DEFAULT/"기본형"): 8탭 전부 + 범용 워크플로 + 5종 전부 ──
--     Jira "빈 스페이스" 대응. 다 켜고 생성, 불필요 탭은 생성 후 [+]/설정에서 끔.
INSERT INTO project_template (code, name, description, icon, default_tabs, default_workflow_id, issue_type_codes, is_system, sort_order)
SELECT 'DEFAULT', '기본형', '모든 보기를 켠 범용 프로젝트(필요 없는 탭은 생성 후 끄기)', 'default',
       '["summary","list","board","backlog","timeline","calendar","approvals","reports"]'::jsonb,
       (SELECT id FROM workflow WHERE name = '범용형'),
       '["EPIC","STORY","TASK","BUG","SUBTASK"]'::jsonb, true, 0;
