-- CR-012 | 번다운/번업·벨로시티(WMP-AGL-006) 스냅샷 테이블.
-- field_verifications(V1:281)·saved_filters(V1:323)는 V1에 이미 존재 → 무변경.
-- 번다운만 스냅샷 테이블이 부재하여 신규 생성한다(T3-1 CR-012).
--
-- 적재 출처(T1-6 이벤트 소비자 + 일별 스케줄러):
--   START    : SprintStarted   → 기준선 total_points 고정(remaining=total, completed=0)
--   DAILY    : @Scheduled 일배치 → ACTIVE 스프린트의 당일 잔여/누적완료 재계산
--   COMPLETE : SprintCompleted → 완료 시점 최종 스냅샷(벨로시티 기준)
-- UNIQUE(sprint_id, snapshot_date)로 같은 일자 재적재는 UPSERT(멱등).

CREATE TABLE burndown_snapshots (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sprint_id         BIGINT       NOT NULL,
    snapshot_date     DATE         NOT NULL,
    remaining_points  INT          NOT NULL DEFAULT 0,
    completed_points  INT          NOT NULL DEFAULT 0,
    total_points      INT          NOT NULL DEFAULT 0,
    snapshot_type     VARCHAR(10)  NOT NULL DEFAULT 'DAILY',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uniq_burndown_sprint_date ON burndown_snapshots (sprint_id, snapshot_date);
CREATE INDEX idx_burndown_sprint ON burndown_snapshots (sprint_id, snapshot_date);
