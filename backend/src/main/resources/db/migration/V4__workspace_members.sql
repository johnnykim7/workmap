-- CR-018 | 워크스페이스 멤버십 격리 경계(BIZ-112, WMP-WS-007).
-- WS = "사람을 모은 격리된 작업공간"(슬랙 모델). 멤버만 그 WS의 프로젝트·업무·검색·대시보드 접근.
-- role 컬럼 없음 — WS별 Admin 안 둠(전사 Admin만, CR-018 결정).

CREATE TABLE workspace_members (
    workspace_id  BIGINT       NOT NULL,
    user_id       BIGINT       NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX idx_workspace_members_user ON workspace_members (user_id);

-- 백필(필수): 격리 경계가 새로 생기므로 기존 사용자가 자기 WS에서 튕기지 않도록 승격.
--   ① 각 프로젝트 멤버를 그 프로젝트의 workspace 멤버로 승격
--   ② 각 워크스페이스 생성자를 멤버로
-- ON CONFLICT로 중복 무시(같은 사용자가 ①②/여러 프로젝트로 중복 산출 가능).
INSERT INTO workspace_members (workspace_id, user_id)
SELECT DISTINCT p.workspace_id, pm.user_id
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
ON CONFLICT (workspace_id, user_id) DO NOTHING;

INSERT INTO workspace_members (workspace_id, user_id)
SELECT w.id, w.created_by
FROM workspaces w
ON CONFLICT (workspace_id, user_id) DO NOTHING;
