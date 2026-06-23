-- WorkMap V1 스키마 (T3-1, CR-006 v0.4)
-- PostgreSQL 16 / PK: BIGINT GENERATED ALWAYS AS IDENTITY / 시각: TIMESTAMPTZ
-- 핵심: work_items 단일 테이블(Epic/Story/Task/Bug/Sub-task = issue_type + parent/epic, BIZ-106)
-- 물리 FK는 운영 정책상 최소화(MyBatis 앱 레벨 검증). 인덱스는 T3-1 정의대로.

-- =====================================================================
-- 마스터 테이블 (관리자 관리, 시스템 시드 — BIZ-107)
-- =====================================================================

CREATE TABLE issue_type (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        VARCHAR(20)  NOT NULL,
    label       VARCHAR(40)  NOT NULL,
    depth       INT          NOT NULL,
    color       VARCHAR(20),
    icon        VARCHAR(40),
    is_system   BOOLEAN      NOT NULL DEFAULT false,
    sort_order  INT          NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX uniq_issue_type_code ON issue_type (code);

CREATE TABLE workflow (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(60)  NOT NULL,
    is_system   BOOLEAN      NOT NULL DEFAULT false
);

CREATE TABLE workflow_status (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    workflow_id     BIGINT       NOT NULL,
    code            VARCHAR(40)  NOT NULL,
    label           VARCHAR(40)  NOT NULL,
    common_status   VARCHAR(20)  NOT NULL,
    is_start        BOOLEAN      NOT NULL DEFAULT false,
    is_done         BOOLEAN      NOT NULL DEFAULT false,
    is_approval     BOOLEAN      NOT NULL DEFAULT false,
    approver_role   VARCHAR(20),
    sort_order      INT          NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX uniq_wf_status ON workflow_status (workflow_id, code);
CREATE INDEX idx_wf_status_order ON workflow_status (workflow_id, sort_order);

CREATE TABLE workflow_transition (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    workflow_id     BIGINT  NOT NULL,
    from_status_id  BIGINT  NOT NULL,
    to_status_id    BIGINT  NOT NULL
);
CREATE UNIQUE INDEX uniq_wf_transition ON workflow_transition (workflow_id, from_status_id, to_status_id);

CREATE TABLE measure_unit (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(40)  NOT NULL,
    value_type  VARCHAR(20)  NOT NULL,
    suffix      VARCHAR(20),
    options     JSONB,
    is_system   BOOLEAN      NOT NULL DEFAULT false,
    sort_order  INT          NOT NULL DEFAULT 0
);
CREATE INDEX idx_measure_unit_system ON measure_unit (is_system);

CREATE TABLE field_scheme (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id      BIGINT,
    issue_type_code VARCHAR(20)  NOT NULL,
    field_key       VARCHAR(40)  NOT NULL,
    is_visible      BOOLEAN      NOT NULL DEFAULT true,
    is_required     BOOLEAN      NOT NULL DEFAULT false,
    sort_order      INT          NOT NULL DEFAULT 0
);
-- project_id NULL(전역 기본) 행도 유일성 보장 위해 COALESCE 기반 인덱스
CREATE UNIQUE INDEX uniq_field_scheme
    ON field_scheme (COALESCE(project_id, 0), issue_type_code, field_key);

CREATE TABLE project_template (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code                 VARCHAR(30)  NOT NULL,
    name                 VARCHAR(60)  NOT NULL,
    description          VARCHAR(200),
    icon                 VARCHAR(40),
    default_tabs         JSONB        NOT NULL,
    default_workflow_id  BIGINT,
    issue_type_codes     JSONB        NOT NULL DEFAULT '[]',
    is_system            BOOLEAN      NOT NULL DEFAULT false,
    sort_order           INT          NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX uniq_project_template_code ON project_template (code);

-- =====================================================================
-- 핵심 엔티티
-- =====================================================================

CREATE TABLE departments (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    parent_id   BIGINT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email          VARCHAR(255) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    name           VARCHAR(50)  NOT NULL,
    role           VARCHAR(20)  NOT NULL DEFAULT 'MEMBER',
    department_id  BIGINT,
    is_active      BOOLEAN      NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_users_email ON users (email);
CREATE INDEX idx_users_department_id ON users (department_id);

CREATE TABLE workspaces (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    created_by  BIGINT       NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE projects (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    workspace_id   BIGINT       NOT NULL,
    key            VARCHAR(10)  NOT NULL,
    name           VARCHAR(200) NOT NULL,
    template_id    BIGINT       NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'PLANNING',
    visibility     VARCHAR(20)  NOT NULL DEFAULT 'PUBLIC',
    workflow_id    BIGINT,
    active_tabs    JSONB,
    seq_counter    INT          NOT NULL DEFAULT 0,
    start_date     DATE,
    end_date       DATE,
    description    TEXT,
    created_by     BIGINT       NOT NULL,
    archived_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_projects_key ON projects (key);
CREATE INDEX idx_projects_workspace ON projects (workspace_id);
CREATE INDEX idx_projects_template ON projects (template_id);
CREATE INDEX idx_projects_status ON projects (status);

CREATE TABLE project_members (
    project_id  BIGINT       NOT NULL,
    user_id     BIGINT       NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'MEMBER',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (project_id, user_id)
);
CREATE INDEX idx_project_members_user ON project_members (user_id);

CREATE TABLE sprints (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id    BIGINT       NOT NULL,
    name          VARCHAR(100) NOT NULL,
    goal          VARCHAR(300),
    status        VARCHAR(20)  NOT NULL DEFAULT 'FUTURE',
    start_date    DATE,
    end_date      DATE,
    sort_order    INT          NOT NULL DEFAULT 0,
    started_at    TIMESTAMPTZ,
    completed_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_sprints_project ON sprints (project_id, status);

CREATE TABLE releases (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id   BIGINT       NOT NULL,
    name         VARCHAR(100) NOT NULL,
    released_at  DATE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE work_items (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key                VARCHAR(20)  NOT NULL,
    project_id         BIGINT       NOT NULL,
    issue_type         VARCHAR(20)  NOT NULL DEFAULT 'TASK',
    parent_id          BIGINT,
    epic_id            BIGINT,
    title              VARCHAR(300) NOT NULL,
    description        TEXT,
    workflow_id        BIGINT       NOT NULL,
    status_id          BIGINT       NOT NULL,
    common_status      VARCHAR(20)  NOT NULL DEFAULT 'TODO',
    priority           VARCHAR(20)  NOT NULL DEFAULT 'NORMAL',
    assignee_id        BIGINT,
    reporter_id        BIGINT,
    sprint_id          BIGINT,
    story_points       INT,
    estimate_hours     NUMERIC(6,2),
    spent_hours        NUMERIC(6,2),
    start_date         DATE,
    due_date           DATE,
    progress           INT          NOT NULL DEFAULT 0,
    block_reason       VARCHAR(500),
    prev_status_id     BIGINT,
    measure_unit_id    BIGINT,
    target_value       NUMERIC(18,2),
    current_value      NUMERIC(18,2),
    acceptance_criteria JSONB,
    steps_to_reproduce  JSONB,
    expected_result    TEXT,
    actual_result      TEXT,
    environment        VARCHAR(200),
    severity           VARCHAR(20),
    checklist          JSONB,
    labels             JSONB        NOT NULL DEFAULT '[]',
    related_solutions  JSONB        NOT NULL DEFAULT '[]',
    ops_apply_status   VARCHAR(30),
    status_changed_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    completed_at       TIMESTAMPTZ,
    deleted_at         TIMESTAMPTZ,
    created_by         BIGINT       NOT NULL,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_work_items_key ON work_items (key);
CREATE INDEX idx_wi_project ON work_items (project_id);
CREATE INDEX idx_wi_type ON work_items (issue_type);
CREATE INDEX idx_wi_parent ON work_items (parent_id);
CREATE INDEX idx_wi_epic ON work_items (epic_id);
CREATE INDEX idx_wi_assignee ON work_items (assignee_id);
CREATE INDEX idx_wi_sprint ON work_items (sprint_id);
CREATE INDEX idx_wi_common_status ON work_items (common_status);
CREATE INDEX idx_wi_due ON work_items (due_date);
CREATE INDEX idx_wi_delay ON work_items (common_status, due_date);
CREATE INDEX idx_wi_active ON work_items (deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE work_item_links (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_id   BIGINT       NOT NULL,
    target_id   BIGINT       NOT NULL,
    link_type   VARCHAR(20)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_wi_link ON work_item_links (source_id, target_id, link_type);
CREATE INDEX idx_wi_link_target ON work_item_links (target_id);

CREATE TABLE comments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    work_item_id        BIGINT       NOT NULL,
    author_id           BIGINT       NOT NULL,
    content             TEXT         NOT NULL,
    mentioned_user_ids  JSONB        NOT NULL DEFAULT '[]',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_work_item ON comments (work_item_id);

CREATE TABLE attachments (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    work_item_id  BIGINT       NOT NULL,
    file_name     VARCHAR(255) NOT NULL,
    file_path     VARCHAR(500) NOT NULL,
    file_size     BIGINT,
    content_type  VARCHAR(100),
    uploaded_by   BIGINT       NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_work_item ON attachments (work_item_id);

CREATE TABLE activity_logs (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    work_item_id  BIGINT       NOT NULL,
    actor_id      BIGINT       NOT NULL,
    action        VARCHAR(40)  NOT NULL,
    from_value    VARCHAR(200),
    to_value      VARCHAR(200),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_logs_work_item ON activity_logs (work_item_id, created_at);

CREATE TABLE field_verifications (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    work_item_id  BIGINT       NOT NULL,
    verifier      VARCHAR(60)  NOT NULL,
    verified_date DATE         NOT NULL,
    location      VARCHAR(200),
    environment   VARCHAR(200),
    test_content  TEXT,
    result        VARCHAR(20)  NOT NULL,
    issues_found  TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_field_verif_work_item ON field_verifications (work_item_id);

CREATE TABLE approvals (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    work_item_id   BIGINT       NOT NULL,
    status_id      BIGINT       NOT NULL,
    requested_by   BIGINT       NOT NULL,
    approver_id    BIGINT,
    approver_role  VARCHAR(20),
    decision       VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    comment        VARCHAR(500),
    decided_by     BIGINT,
    decided_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_approvals_work_item ON approvals (work_item_id);
CREATE INDEX idx_approvals_pending ON approvals (decision, approver_id);
CREATE INDEX idx_approvals_status ON approvals (status_id);

CREATE TABLE notifications (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient_id  BIGINT       NOT NULL,
    type          VARCHAR(40)  NOT NULL,
    work_item_id  BIGINT,
    message       VARCHAR(500) NOT NULL,
    is_read       BOOLEAN      NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, is_read, created_at);

CREATE TABLE saved_filters (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id    BIGINT       NOT NULL,
    name        VARCHAR(100) NOT NULL,
    query       JSONB        NOT NULL,
    is_shared   BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE forms (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id      BIGINT       NOT NULL,
    issue_type_code VARCHAR(20)  NOT NULL,
    name            VARCHAR(100) NOT NULL,
    fields          JSONB        NOT NULL,
    is_public       BOOLEAN      NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
