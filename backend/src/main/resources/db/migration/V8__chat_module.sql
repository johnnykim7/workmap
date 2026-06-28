-- =====================================================================
-- V8: 커뮤니케이션(Chat) 모듈 — Slack 유사 채널 메시징 (axopm comm 포팅, CR-025)
--  - 워크스페이스 단위 채널 (project_id/opm_* 미사용 — WorkMap 1차 범위)
--  - axopm CHAR(36) UUID → WorkMap BIGINT IDENTITY 컨벤션으로 변환
--  - LONGTEXT → TEXT, DATETIME(6) → TIMESTAMPTZ
--  - 메시지/답글 본문은 Tiptap HTML(content_html, CR-024 에디터 재사용)
-- =====================================================================

-- 채널 -------------------------------------------------------------------
CREATE TABLE chat_channels (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    workspace_id    BIGINT       NOT NULL,
    name            VARCHAR(100) NOT NULL,                 -- 슬러그(고유키): "general"
    display_name    VARCHAR(150),                          -- 표시명: "# 일반"
    description     VARCHAR(500),
    is_system       BOOLEAN      NOT NULL DEFAULT false,   -- 시스템 채널은 삭제 불가
    member_count    INT          NOT NULL DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_chat_channel_name UNIQUE (workspace_id, name)
);
CREATE INDEX idx_chat_channel_ws ON chat_channels (workspace_id);

-- 메시지 -----------------------------------------------------------------
CREATE TABLE chat_messages (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    channel_id    BIGINT      NOT NULL,
    workspace_id  BIGINT      NOT NULL,
    author_id     BIGINT,                                  -- NULL = 시스템 봇
    author_type   VARCHAR(20) NOT NULL DEFAULT 'USER',     -- USER / SYSTEM_BOT
    content_html  TEXT        NOT NULL,
    reply_count   INT         NOT NULL DEFAULT 0,
    last_reply_at TIMESTAMPTZ,
    edited_at     TIMESTAMPTZ,                             -- NULL = 미수정
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_msg_channel ON chat_messages (channel_id, created_at);

-- 답글(스레드) -----------------------------------------------------------
CREATE TABLE chat_replies (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message_id   BIGINT      NOT NULL,
    channel_id   BIGINT      NOT NULL,
    workspace_id BIGINT      NOT NULL,
    author_id    BIGINT,
    content_html TEXT        NOT NULL,
    edited_at    TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_reply_message ON chat_replies (message_id, created_at);

-- 이모지 리액션 ----------------------------------------------------------
CREATE TABLE chat_reactions (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message_id BIGINT,                                     -- message_id XOR reply_id
    reply_id   BIGINT,
    user_id    BIGINT      NOT NULL,
    emoji      VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_chat_reaction UNIQUE (message_id, reply_id, user_id, emoji)
);
CREATE INDEX idx_chat_reaction_message ON chat_reactions (message_id);
CREATE INDEX idx_chat_reaction_reply   ON chat_reactions (reply_id);

-- 읽음 커서 --------------------------------------------------------------
CREATE TABLE chat_read_cursors (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    channel_id           BIGINT      NOT NULL,
    user_id              BIGINT      NOT NULL,
    last_read_message_id BIGINT,
    last_read_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_chat_read_cursor UNIQUE (channel_id, user_id)
);

-- 멘션 -------------------------------------------------------------------
CREATE TABLE chat_mentions (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message_id        BIGINT,
    reply_id          BIGINT,
    mentioned_user_id BIGINT      NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_mention_user    ON chat_mentions (mentioned_user_id);
CREATE INDEX idx_chat_mention_message ON chat_mentions (message_id);

-- 첨부파일 (CR-024 FileStorage URL 메타데이터) ---------------------------
CREATE TABLE chat_attachments (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message_id   BIGINT,
    reply_id     BIGINT,
    workspace_id BIGINT       NOT NULL,
    file_name    VARCHAR(255) NOT NULL,
    file_url     VARCHAR(500) NOT NULL,                    -- /api/v1/files/serve/{name}
    content_type VARCHAR(100) NOT NULL,
    file_size    BIGINT       NOT NULL,
    uploaded_by  BIGINT       NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_attach_message ON chat_attachments (message_id);
CREATE INDEX idx_chat_attach_reply   ON chat_attachments (reply_id);

-- 핀 --------------------------------------------------------------------
CREATE TABLE chat_pins (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    channel_id BIGINT      NOT NULL,
    message_id BIGINT      NOT NULL,
    pinned_by  BIGINT      NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_chat_pin UNIQUE (channel_id, message_id)
);

-- 북마크 -----------------------------------------------------------------
CREATE TABLE chat_bookmarks (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    message_id BIGINT      NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_chat_bookmark UNIQUE (user_id, message_id)
);

-- 알림 설정 --------------------------------------------------------------
CREATE TABLE chat_notification_settings (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      BIGINT      NOT NULL,
    channel_id   BIGINT      NOT NULL,
    mute_until   TIMESTAMPTZ,
    notify_level VARCHAR(20) NOT NULL DEFAULT 'ALL',       -- ALL / MENTIONS_ONLY / NONE
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_chat_notif_setting UNIQUE (user_id, channel_id)
);

-- 채널 멤버 --------------------------------------------------------------
CREATE TABLE chat_channel_members (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    channel_id BIGINT      NOT NULL,
    user_id    BIGINT      NOT NULL,
    role       VARCHAR(20) NOT NULL DEFAULT 'MEMBER',      -- OWNER / MEMBER
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_chat_channel_member UNIQUE (channel_id, user_id)
);
CREATE INDEX idx_chat_member_user ON chat_channel_members (user_id);
