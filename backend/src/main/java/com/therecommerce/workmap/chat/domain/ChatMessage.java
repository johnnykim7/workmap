package com.therecommerce.workmap.chat.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * chat_messages 도메인 (CR-025). author_id=null 이면 시스템 봇.
 * content_html = Tiptap HTML(CR-024 에디터 재사용).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    private Long id;
    private Long channelId;
    private Long workspaceId;
    private Long authorId;
    private String authorType;   // USER / SYSTEM_BOT
    private String contentHtml;
    private int replyCount;
    private OffsetDateTime lastReplyAt;
    private OffsetDateTime editedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
