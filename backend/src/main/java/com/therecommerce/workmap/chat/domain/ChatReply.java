package com.therecommerce.workmap.chat.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/** chat_replies 도메인 (CR-025). 메시지 스레드 답글. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatReply {

    private Long id;
    private Long messageId;
    private Long channelId;
    private Long workspaceId;
    private Long authorId;
    private String contentHtml;
    private OffsetDateTime editedAt;
    private OffsetDateTime createdAt;
}
