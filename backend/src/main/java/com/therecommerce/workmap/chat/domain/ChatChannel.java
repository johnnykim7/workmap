package com.therecommerce.workmap.chat.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * chat_channels 도메인 (CR-025, axopm comm 포팅). 워크스페이스 단위 채널.
 * MyBatis setter 매핑 — {@code @NoArgsConstructor} 유지(CR-008).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatChannel {

    private Long id;
    private Long workspaceId;
    private String name;
    private String displayName;
    private String description;
    private boolean isSystem;
    private int memberCount;
    private OffsetDateTime lastMessageAt;
    private Long createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
