-- CR-046 — 워크스페이스 보관(소프트 동결) 상태 컬럼.
-- 보관은 목록/스위처에서 숨기기만 하고 하위 리소스는 보존한다(BIZ-113). FSM: ACTIVE⇄ARCHIVED(T1-5).

ALTER TABLE workspaces
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN archived_at TIMESTAMPTZ NULL;

-- 목록 조회가 기본 status='ACTIVE'로 필터하므로 인덱스(BIZ-113).
CREATE INDEX idx_workspaces_status ON workspaces (status);
