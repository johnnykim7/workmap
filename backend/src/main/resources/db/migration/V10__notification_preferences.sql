-- =====================================================================
-- V10: 알림 수신 설정 + 푸시 기기 토큰 (CR-028 — 각종 알림 확장)
--  - notification_preferences: 사용자별 알림 종류 × 채널(인앱/이메일/푸시) on/off (WMP-NOTI-003)
--  - fcm_tokens: 푸시 전달용 FCM 기기 토큰 (WMP-NOTI-004)
--  - notifications 테이블은 무변경(type=VARCHAR(40) 그대로, NotificationType enum만 확장)
--  - V9는 CR-027(invitations·email_otp) 점유 — CR-028은 V10
-- =====================================================================

-- 알림 수신 설정 (sparse 저장) -------------------------------------------
-- 행이 없는 종류는 시스템 기본값(in_app=true·email=false·push=false) 적용.
-- 사용자가 한 종류라도 바꾸면 그 종류만 행 생성(upsert).
CREATE TABLE notification_preferences (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    type       VARCHAR(40) NOT NULL,                       -- NotificationType (ASSIGNED 등)
    in_app     BOOLEAN     NOT NULL DEFAULT true,          -- 받은함 표시/배지(원장 기록 자체는 항상)
    email      BOOLEAN     NOT NULL DEFAULT false,         -- 이메일 전달(bp-notification)
    push       BOOLEAN     NOT NULL DEFAULT false,         -- 푸시 전달(FCM)
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_notif_pref UNIQUE (user_id, type)
);

-- 푸시 기기 토큰 ---------------------------------------------------------
-- 로그인 시 등록·로그아웃 시 삭제. 한 사용자 다기기 허용.
CREATE TABLE fcm_tokens (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    fcm_token   VARCHAR(512) NOT NULL,
    device_info VARCHAR(200),                              -- iOS/Android/Web 등
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_fcm_token UNIQUE (user_id, fcm_token)
);
CREATE INDEX idx_fcm_tokens_user ON fcm_tokens (user_id);
