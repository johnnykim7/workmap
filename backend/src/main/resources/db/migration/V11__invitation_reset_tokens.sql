-- CR-027 토큰 보정 | 초대·분실재설정을 인증번호(OTP)→토큰 링크로 전환.
-- invitations에 token_hash 추가, password_reset_tokens 신설.
-- email_otp는 CHANGE 전용으로 용도만 좁힘(스키마 변경 없음).

-- 기존 PENDING 초대(OTP 방식)는 토큰이 없으므로 만료 처리(신규 초대부터 토큰 방식).
UPDATE invitations SET status = 'EXPIRED', updated_at = now() WHERE status = 'PENDING';

-- 초대 수락 토큰 해시(SHA-256). 평문은 메일 링크로만 전달·미저장.
-- 기존 행은 위에서 EXPIRED 처리됐으므로 빈 값으로 채워도 무방(수락 불가).
ALTER TABLE invitations ADD COLUMN token_hash VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE invitations ALTER COLUMN token_hash DROP DEFAULT;
CREATE INDEX idx_invitations_token_hash ON invitations (token_hash);

-- 비밀번호 재설정 토큰(분실 재설정 링크). 짧은 만료(30분), 1회용.
CREATE TABLE password_reset_tokens (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,
    consumed_at TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_prt_token_hash ON password_reset_tokens (token_hash);
CREATE INDEX idx_prt_user       ON password_reset_tokens (user_id);
CREATE INDEX idx_prt_expires    ON password_reset_tokens (expires_at);

-- 기존 INVITE/RESET 인증번호(OTP)는 더 이상 발급 안 함 — 미소비분 무효화(CHANGE만 유지).
UPDATE email_otp SET consumed_at = now()
 WHERE purpose IN ('INVITE', 'RESET') AND consumed_at IS NULL;
