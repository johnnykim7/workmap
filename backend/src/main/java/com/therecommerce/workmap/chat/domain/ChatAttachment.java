package com.therecommerce.workmap.chat.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/** chat_attachments 도메인 (CR-025). CR-024 FileStorage URL 메타데이터. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatAttachment {

    private Long id;
    private Long messageId;
    private Long replyId;
    private Long workspaceId;
    private String fileName;
    private String fileUrl;
    private String contentType;
    private long fileSize;
    private Long uploadedBy;
    private OffsetDateTime createdAt;
}
