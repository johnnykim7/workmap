-- CR-043 | EVM 획득가치 baseline (WMP-HOME-013, 3차).
-- SPI/CPI 계산의 PV(Planned Value) 기준선. 프로젝트 계획 확정 시 총 계획 포인트·계획 완료일을 동결한다.
--   SPI = EV / PV (일정 효율, 1.0 기준 >1 앞섬),  CPI = EV / AC (비용 효율).
--   EV = 완료 포인트(실측), AC = 소비(spent_hours 등, 3차 확정), PV = baseline에서 경과일 비례 산출.
--
-- is_active로 baseline 이력 관리(재계획 시 새 baseline 활성화, 과거는 보존). 프로젝트당 활성 1행.

CREATE TABLE project_baselines (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id      BIGINT       NOT NULL,
    planned_points  INT          NOT NULL DEFAULT 0,
    planned_start   DATE,
    planned_end     DATE,
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 프로젝트당 활성 baseline 1개만(부분 유니크).
CREATE UNIQUE INDEX uniq_project_baseline_active
    ON project_baselines (project_id) WHERE is_active = true;
CREATE INDEX idx_project_baseline ON project_baselines (project_id);
