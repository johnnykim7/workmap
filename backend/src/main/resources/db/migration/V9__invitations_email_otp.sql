-- CR-027 | 이메일 초대 가입 + 비밀번호 재설정/변경(인증번호 OTP)
-- users 스키마는 무변경. 초대는 invitations에만 보관하고 user는 수락 시점에 생성한다.

-- 사용자 초대 (WMP-AUTH-004). status: PENDING/ACCEPTED/EXPIRED/REVOKED
CREATE TABLE invitations (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email          VARCHAR(255) NOT NULL,
    name           VARCHAR(50)  NOT NULL,
    role           VARCHAR(20)  NOT NULL DEFAULT 'MEMBER',
    department_id  BIGINT,
    status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    invited_by     BIGINT       NOT NULL,
    expires_at     TIMESTAMPTZ  NOT NULL,
    accepted_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_invitations_email  ON invitations (email);
CREATE INDEX idx_invitations_status ON invitations (status);
-- 같은 이메일에 PENDING 초대 중복 차단(부분 유니크).
CREATE UNIQUE INDEX uniq_invitations_pending_email ON invitations (email) WHERE status = 'PENDING';

-- 이메일 인증번호(OTP) — 초대/분실재설정/변경 통일(POL-013). 인증번호 평문 미저장(해시).
-- purpose: INVITE / RESET / CHANGE
CREATE TABLE email_otp (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email          VARCHAR(255) NOT NULL,
    purpose        VARCHAR(20)  NOT NULL,
    code_hash      VARCHAR(255) NOT NULL,
    user_id        BIGINT,
    attempt_count  INT          NOT NULL DEFAULT 0,
    consumed_at    TIMESTAMPTZ,
    expires_at     TIMESTAMPTZ  NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_otp_lookup  ON email_otp (email, purpose, consumed_at);
CREATE INDEX idx_email_otp_expires ON email_otp (expires_at);
