-- =====================================================================
-- V7: 문서(DOC) 업무 유형 추가 (Jira 스크럼 구조의 Doc 유형)
--  - issue_type 마스터에 DOC 1행(is_system, depth 1 — Story/Task/Bug와 동급, Sub-task 부모 불가)
--  - 기본 개발형(DEV) 템플릿 issue_type_codes에 "DOC" 편입
--  계층 규칙(부모 불가 등)은 코드(IssueType enum)에서 강제 — 여기서는 마스터/템플릿만.
-- =====================================================================

-- 1) issue_type 마스터: DOC (sort_order는 BUG(4)와 SUBTASK(5) 사이 → SUBTASK를 6으로 밀지 않고 4.5 대신 5 앞 정렬용으로 5 유지가 어려우니 SUBTASK 뒤 6으로 둔다)
INSERT INTO issue_type (code, label, depth, color, icon, is_system, sort_order)
VALUES ('DOC', '문서', 1, 'amber', 'doc', true, 6)
ON CONFLICT (code) DO NOTHING;

-- 2) 시스템 템플릿(개발형 계열)의 issue_type_codes에 DOC 추가(중복 없으면).
--    V2 'DEV' / V5 기본 개발형 등 EPIC/STORY/TASK/BUG/SUBTASK를 가진 시스템 템플릿이 대상.
UPDATE project_template
SET issue_type_codes = issue_type_codes || '["DOC"]'::jsonb
WHERE is_system = true
  AND issue_type_codes @> '["STORY"]'::jsonb
  AND NOT (issue_type_codes @> '["DOC"]'::jsonb);
