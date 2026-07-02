-- CR-032 | 가입 요청(셀프 신청 → 관리자 승인 → 초대 발송). user 미생성 — 승인 시 invitations로 이관.
CREATE TABLE signup_requests (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email          VARCHAR(255) NOT NULL,
    name           VARCHAR(50)  NOT NULL,
    reason         VARCHAR(500),
    status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',  -- PENDING / APPROVED / REJECTED
    processed_by   BIGINT,
    reject_reason  VARCHAR(500),
    processed_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_signup_requests_status ON signup_requests (status);
-- 같은 이메일에 대기(PENDING) 신청 중복 차단.
CREATE UNIQUE INDEX uniq_signup_pending_email ON signup_requests (email) WHERE status = 'PENDING';
