-- CR-043 | Say-Do Ratio 커밋 동결값 (WMP-HOME-008, 2차).
-- 스프린트 시작(ACTIVE 전이) 시점에 그 스프린트에 배정된 항목/포인트를 "약속(commitment)"으로 동결한다.
-- Say-Do = 완료(그 중 DONE 도달) ÷ 약속(동결값). 시작 후 추가/제거는 스코프 변경률로 별도 추적.
--
-- 적재 출처: SprintStarted 이벤트(스프린트 시작 시 1행 동결). 스프린트당 1행(UNIQUE sprint_id).
--   committed_item_ids = 동결 시점 sprint_id 배정 항목 id 배열(JSONB) — 완료 판정·스코프변경 비교 기준.
--   ⚠️ JSONB insert 시 JDBC URL stringtype=unspecified 필요(기존 인프라 반영됨).

CREATE TABLE sprint_commitments (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sprint_id            BIGINT       NOT NULL,
    committed_item_count INT          NOT NULL DEFAULT 0,
    committed_points     INT          NOT NULL DEFAULT 0,
    committed_item_ids   JSONB        NOT NULL DEFAULT '[]',
    committed_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uniq_sprint_commitment ON sprint_commitments (sprint_id);
