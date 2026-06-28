package com.therecommerce.workmap.chat.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/** chat_bookmarks 도메인 (CR-025). 사용자별 메시지 1회 북마크(UNIQUE). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatBookmark {

    private Long id;
    private Long userId;
    private Long messageId;
    private OffsetDateTime createdAt;
}
