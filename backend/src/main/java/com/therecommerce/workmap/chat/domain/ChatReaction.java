package com.therecommerce.workmap.chat.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/** chat_reactions 도메인 (CR-025). message_id XOR reply_id 중 하나에 매다. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatReaction {

    private Long id;
    private Long messageId;
    private Long replyId;
    private Long userId;
    private String emoji;
    private OffsetDateTime createdAt;
}
