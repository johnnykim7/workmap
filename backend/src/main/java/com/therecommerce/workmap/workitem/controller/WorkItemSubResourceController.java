package com.therecommerce.workmap.workitem.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.workitem.dto.LinkDtos;
import com.therecommerce.workmap.workitem.dto.SubResourceDtos;
import com.therecommerce.workmap.workitem.service.ActivityLogService;
import com.therecommerce.workmap.workitem.service.AttachmentService;
import com.therecommerce.workmap.workitem.service.CommentService;
import com.therecommerce.workmap.workitem.service.WorkItemLinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import com.therecommerce.workmap.common.security.WmpAuthz;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 업무 항목 하위 리소스 API (T3-2 F1/F2): 링크/댓글/첨부/활동이력.
 */
@RestController
@RequestMapping("/api/v1/work-items/{id}")
@RequiredArgsConstructor
public class WorkItemSubResourceController {

    private final CommentService commentService;
    private final AttachmentService attachmentService;
    private final ActivityLogService activityLogService;
    private final WorkItemLinkService linkService;

    // ── 댓글 ──
    @GetMapping("/comments")
    public ResponseDto<List<SubResourceDtos.CommentResponse>> listComments(@PathVariable Long id) {
        return ResponseDto.success(commentService.list(id));
    }

    @PreAuthorize(WmpAuthz.WRITER)
    @PostMapping("/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseDto<SubResourceDtos.CommentResponse> createComment(
            @PathVariable Long id,
            @Valid @RequestBody SubResourceDtos.CreateCommentRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(commentService.create(id, req, userId));
    }

    // ── 첨부 ──
    // kind 미지정=전체(하위호환), REFERENCE=참고자료·RESULT=결과물(CR-051, BIZ-118).
    @GetMapping("/attachments")
    public ResponseDto<List<SubResourceDtos.AttachmentResponse>> listAttachments(
            @PathVariable Long id,
            @RequestParam(required = false) String kind) {
        return ResponseDto.success(attachmentService.list(id, kind));
    }

    @PreAuthorize(WmpAuthz.WRITER)
    @PostMapping("/attachments")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseDto<SubResourceDtos.AttachmentResponse> createAttachment(
            @PathVariable Long id,
            @Valid @RequestBody SubResourceDtos.CreateAttachmentRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(attachmentService.create(id, req, userId));
    }

    @PreAuthorize(WmpAuthz.WRITER)
    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseDto<Void> deleteAttachment(@PathVariable Long id, @PathVariable Long attachmentId,
                                              @AuthUserInfo("userId") Long userId) {
        attachmentService.delete(id, attachmentId, userId);
        return ResponseDto.success(null);
    }

    // ── 활동 이력 ──
    @GetMapping("/activities")
    public ResponseDto<List<SubResourceDtos.ActivityResponse>> listActivities(@PathVariable Long id) {
        return ResponseDto.success(activityLogService.list(id));
    }

    // ── 링크(연결된 업무 항목, F1·WMP-WI-013·BIZ-109) ──
    @GetMapping("/links")
    public ResponseDto<List<LinkDtos.LinkView>> listLinks(@PathVariable Long id) {
        return ResponseDto.success(linkService.list(id));
    }

    @PreAuthorize(WmpAuthz.WRITER)
    @PostMapping("/links")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseDto<List<LinkDtos.LinkView>> createLink(
            @PathVariable Long id,
            @Valid @RequestBody LinkDtos.CreateLinkRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(linkService.create(id, req, userId));
    }

    @PreAuthorize(WmpAuthz.WRITER)
    @DeleteMapping("/links/{linkId}")
    public ResponseDto<Void> deleteLink(@PathVariable Long id, @PathVariable Long linkId,
                                        @AuthUserInfo("userId") Long userId) {
        linkService.delete(id, linkId, userId);
        return ResponseDto.success(null);
    }
}
