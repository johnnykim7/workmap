-- CR-050 (WMP-WI-019): AI 업무 초안(aimbase) — draft 플래그.
-- draft=true = AI가 만든 초안. 백로그에서만 "초안"으로 구분표시되고 그 외 모든 조회/집계에서 제외(BIZ-117).
-- 사람이 확정하면 draft=false로 정식 전환.

ALTER TABLE work_items
    ADD COLUMN draft BOOLEAN NOT NULL DEFAULT false;

-- 프로젝트별 초안 목록 조회·전체 버리기용 부분 인덱스(초안은 소수라 부분 인덱스가 효율적).
CREATE INDEX idx_wi_draft ON work_items (project_id) WHERE draft = true;
