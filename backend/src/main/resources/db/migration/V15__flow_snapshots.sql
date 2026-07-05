-- CR-043 | 흐름 지표 CFD 누적 흐름도 스냅샷 (WMP-HOME-007, 2차).
-- 프로젝트 × 상태(common_status) × 날짜별 미완료+완료 항목 카운트를 일배치로 적재.
-- CFD는 이 스냅샷의 밴드(상태별 누적)를 시계열로 그린다 — 밴드가 평행하면 건강, 벌어지면 WIP·지연 증가.
--
-- 적재 출처: @Scheduled 일배치(매일, ACTIVE/전체 프로젝트의 당일 상태 분포 스냅샷).
--   burndown_snapshots(V3) 패턴 재사용 — UNIQUE(project_id, snapshot_date, common_status)로 멱등 UPSERT.
-- 원시 상태 이력(activity_logs)으로 소급 재구성도 가능하나, 스냅샷이 조회 성능·단순성에서 우위(표준 CFD 방식).

CREATE TABLE flow_snapshots (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id     BIGINT       NOT NULL,
    snapshot_date  DATE         NOT NULL,
    common_status  VARCHAR(20)  NOT NULL,
    item_count     INT          NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uniq_flow_project_date_status
    ON flow_snapshots (project_id, snapshot_date, common_status);
CREATE INDEX idx_flow_project_date ON flow_snapshots (project_id, snapshot_date);
