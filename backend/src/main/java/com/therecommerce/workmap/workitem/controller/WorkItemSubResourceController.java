package com.therecommerce.workmap.workitem.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.workitem.dto.SubResourceDtos;
import com.therecommerce.workmap.workitem.service.ActivityLogService;
import com.therecommerce.workmap.workitem.service.AttachmentService;
import com.therecommerce.workmap.workitem.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 업무 항목 하위 리소스 API (T3-2 F2): 댓글/첨부/활동이력.
 */
@RestController
@RequestMapping("/api/v1/work-items/{id}")
@RequiredArgsConstructor
public class WorkItemSubResourceController {

    private final CommentService commentService;
    private final AttachmentService attachmentService;
    private final ActivityLogService activityLogService;

    // ── 댓글 ──
    @GetMapping("/comments")
    public ResponseDto<List<SubResourceDtos.CommentResponse>> listComments(@PathVariable Long id) {
        return ResponseDto.success(commentService.list(id));
    }

    @PostMapping("/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseDto<SubResourceDtos.CommentResponse> createComment(
            @PathVariable Long id,
            @Valid @RequestBody SubResourceDtos.CreateCommentRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(commentService.create(id, req, userId));
    }

    // ── 첨부 ──
    @GetMapping("/attachments")
    public ResponseDto<List<SubResourceDtos.AttachmentResponse>> listAttachments(@PathVariable Long id) {
        return ResponseDto.success(attachmentService.list(id));
    }

    @PostMapping("/attachments")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseDto<SubResourceDtos.AttachmentResponse> createAttachment(
            @PathVariable Long id,
            @Valid @RequestBody SubResourceDtos.CreateAttachmentRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(attachmentService.create(id, req, userId));
    }

    // ── 활동 이력 ──
    @GetMapping("/activities")
    public ResponseDto<List<SubResourceDtos.ActivityResponse>> listActivities(@PathVariable Long id) {
        return ResponseDto.success(activityLogService.list(id));
    }
}
