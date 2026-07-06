-- BIZ-103 계층 정합성 보강: Sub-task 외 유형은 부모(parent_id)를 가질 수 없다(HRC-5).
-- 배경: 샘플/수동 INSERT로 TASK가 STORY를 parent_id로 매단 오염 데이터가 유입됨.
--       정식 createSubtask 경로는 항상 SUBTASK를 강제하나, create 경로에 검증 구멍이 있었음.
--       코드(validateHierarchy)와 함께 DB CHECK 제약으로 우겨넣기를 이중 차단한다.

-- 1) 기존 오염 정리: Sub-task가 아닌 유형의 parent_id를 끊는다(유형·내용 보존, 계층만 해제).
UPDATE work_items
   SET parent_id = NULL
 WHERE issue_type <> 'SUBTASK'
   AND parent_id IS NOT NULL;

-- 2) DB 레벨 차단: Sub-task만 parent_id를 가질 수 있다.
ALTER TABLE work_items
  ADD CONSTRAINT chk_subtask_parent
  CHECK (issue_type = 'SUBTASK' OR parent_id IS NULL);
