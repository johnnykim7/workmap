package com.therecommerce.workmap.chat.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/** chat_mentions 도메인 (CR-025). 메시지/답글에서 @멘션된 사용자. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMention {

    private Long id;
    private Long messageId;
    private Long replyId;
    private Long mentionedUserId;
    private OffsetDateTime createdAt;
}
