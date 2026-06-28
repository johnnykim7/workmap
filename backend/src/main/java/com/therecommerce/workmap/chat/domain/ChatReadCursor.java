package com.therecommerce.workmap.chat.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/** chat_read_cursors 도메인 (CR-025). 채널별 사용자별 마지막 읽은 위치. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatReadCursor {

    private Long id;
    private Long channelId;
    private Long userId;
    private Long lastReadMessageId;
    private OffsetDateTime lastReadAt;
}
