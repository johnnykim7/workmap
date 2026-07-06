-- CR-048 (WMP-WI-017): 업무 "결과"(완료 산출물) 섹션.
-- 본문(description)=지시서, 댓글=티키타카, 결과(result_content)=완료 산출물(무엇이 되었나, BIZ-114).
-- 업무당 1개(1:1)·덮어쓰기. 결과 이력은 남기지 않음(진행 이력은 댓글이 받음).
-- 리치텍스트 HTML(CR-024 에디터), 파일 산출물은 기존 첨부(WMP-WI-012) 재사용.
ALTER TABLE work_items ADD COLUMN result_content    TEXT;
ALTER TABLE work_items ADD COLUMN result_written_by BIGINT;
ALTER TABLE work_items ADD COLUMN result_written_at TIMESTAMPTZ;
