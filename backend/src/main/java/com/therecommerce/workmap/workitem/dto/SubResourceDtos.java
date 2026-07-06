package com.therecommerce.workmap.workitem.dto;

import com.therecommerce.workmap.workitem.domain.ActivityLog;
import com.therecommerce.workmap.workitem.domain.Attachment;
import com.therecommerce.workmap.workitem.domain.Comment;
import jakarta.validation.constraints.NotBlank;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 업무 항목 하위 리소스(댓글/첨부/활동이력) 요청·응답 DTO (T3-2 F2).
 */
public final class SubResourceDtos {

    private SubResourceDtos() {}

    // ── 댓글 ──
    public record CreateCommentRequest(
            @NotBlank String content,
            List<Long> mentionedUserIds
    ) {}

    public record CommentResponse(
            Long id,
            Long workItemId,
            Long authorId,
            String content,
            List<Long> mentionedUserIds,
            OffsetDateTime createdAt
    ) {
        public static CommentResponse from(Comment c) {
            return new CommentResponse(c.getId(), c.getWorkItemId(), c.getAuthorId(),
                    c.getContent(), c.getMentionedUserIds(), c.getCreatedAt());
        }
    }

    // ── 첨부 ──
    public record CreateAttachmentRequest(
            @NotBlank String fileName,
            @NotBlank String filePath,
            Long fileSize,
            String contentType,
            String kind              // REFERENCE(기본)/RESULT — 서버가 정규화(CR-051)
    ) {}

    public record AttachmentResponse(
            Long id,
            Long workItemId,
            String fileName,
            String filePath,
            Long fileSize,
            String contentType,
            String kind,
            Long uploadedBy,
            OffsetDateTime createdAt
    ) {
        public static AttachmentResponse from(Attachment a) {
            return new AttachmentResponse(a.getId(), a.getWorkItemId(), a.getFileName(),
                    a.getFilePath(), a.getFileSize(), a.getContentType(), a.getKind(), a.getUploadedBy(), a.getCreatedAt());
        }
    }

    // ── 활동 이력 ──
    public record ActivityResponse(
            Long id,
            Long workItemId,
            Long actorId,
            String action,
            String fromValue,
            String toValue,
            OffsetDateTime createdAt
    ) {
        public static ActivityResponse from(ActivityLog l) {
            return new ActivityResponse(l.getId(), l.getWorkItemId(), l.getActorId(),
                    l.getAction(), l.getFromValue(), l.getToValue(), l.getCreatedAt());
        }
    }
}
