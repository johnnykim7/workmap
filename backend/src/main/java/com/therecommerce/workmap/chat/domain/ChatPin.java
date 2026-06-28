package com.therecommerce.workmap.chat.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/** chat_pins 도메인 (CR-025). 채널당 메시지 1회 핀(UNIQUE). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatPin {

    private Long id;
    private Long channelId;
    private Long messageId;
    private Long pinnedBy;
    private OffsetDateTime createdAt;
}
