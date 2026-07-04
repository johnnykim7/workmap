-- CR-040: 막힘을 상태 전이 → Jira Flag 방식으로 전환.
-- flagged 깃발 컬럼 추가(상태와 독립). block_reason은 사유 저장용으로 재활용(유지).
-- prev_status_id는 더 이상 쓰지 않음(상태 복귀 로직 폐기) → 드롭.

ALTER TABLE work_items
    ADD COLUMN flagged BOOLEAN NOT NULL DEFAULT false;

-- 기존 BLOCKED 상태로 물려 있던 데이터 정합화(어느 워크플로에도 BLOCKED 상태가 시드된 적 없어
-- 실사용 0건 예상 — 방어적).
--   1) common_status='BLOCKED' 행을 flagged=true로 승격.
UPDATE work_items
SET flagged = true
WHERE common_status = 'BLOCKED';

--   2) 직전 상태(prev_status_id)가 있으면 그 상태로 복원(status_id + common_status 동기화).
UPDATE work_items w
SET status_id = w.prev_status_id,
    common_status = s.common_status
FROM workflow_status s
WHERE w.common_status = 'BLOCKED'
  AND w.prev_status_id IS NOT NULL
  AND s.id = w.prev_status_id;

-- prev_status_id 드롭(상태 복귀 로직 폐기).
ALTER TABLE work_items DROP COLUMN prev_status_id;

-- 막힘 목록/대시보드 필터가 flagged 기준으로 바뀌므로 부분 인덱스 추가.
CREATE INDEX idx_wi_flagged ON work_items (flagged) WHERE flagged = true;
