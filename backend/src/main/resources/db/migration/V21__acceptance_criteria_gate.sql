-- V21: 인수조건 체크 + 완료 강제(선택) (CR-049, WMP-WI-018)
-- ① 프로젝트별 강제 토글(POL-015/BIZ-116) ② 활동로그 스냅샷 컬럼 ③ 인수조건 값 구조 승격(BIZ-115)

-- ① 프로젝트별 "인수조건 미충족 시 완료 차단" 강제 여부. 기본 false(비강제).
ALTER TABLE projects ADD COLUMN require_acceptance_criteria BOOLEAN NOT NULL DEFAULT false;

-- ② 활동로그 구조화 부가정보(COMPLETE_WITH_UNMET 미충족 스냅샷 등). nullable.
ALTER TABLE activity_logs ADD COLUMN metadata JSONB;

-- ③ acceptance_criteria 값 구조 승격: ["문장"] → [{text,checked,checkedBy,checkedAt}]
--    컬럼 타입(JSONB) 무변경, 값만 재구성. 이미 객체 배열이거나 비어있으면 건너뜀(재실행 방어).
UPDATE work_items
SET acceptance_criteria = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'text', elem,
            'checked', false,
            'checkedBy', NULL,
            'checkedAt', NULL
        )
    )
    FROM jsonb_array_elements_text(acceptance_criteria) AS elem
)
WHERE acceptance_criteria IS NOT NULL
  AND jsonb_typeof(acceptance_criteria) = 'array'
  AND jsonb_array_length(acceptance_criteria) > 0
  -- 첫 원소가 문자열일 때만 변환(이미 객체면 = 이미 승격됨, 재실행 방어)
  AND jsonb_typeof(acceptance_criteria -> 0) = 'string';
