package com.therecommerce.workmap.workitem.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.event.WorkItemEvents;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.workitem.domain.Comment;
import com.therecommerce.workmap.workitem.dto.SubResourceDtos;
import com.therecommerce.workmap.workitem.mapper.CommentMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * 댓글 서비스(WMP-WI-009). @멘션 포함 시 WorkItemMentioned 발행(CMT-2, 멱등 키=commentId).
 */
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentMapper commentMapper;
    private final WorkItemMapper workItemMapper;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    @Transactional
    public SubResourceDtos.CommentResponse create(Long workItemId,
                                                  SubResourceDtos.CreateCommentRequest req, Long actorId) {
        if (workItemMapper.findById(workItemId) == null) {
            throw new BusinessException(WmpErrorCode.WORK_ITEM_NOT_FOUND);
        }
        List<Long> mentions = req.mentionedUserIds() == null ? List.of() : req.mentionedUserIds();
        Comment comment = Comment.builder()
                .workItemId(workItemId)
                .authorId(actorId)
                .content(req.content())
                .mentionedUserIds(mentions)
                .build();
        commentMapper.insert(comment);

        if (!mentions.isEmpty()) {
            OffsetDateTime now = OffsetDateTime.now(clock);
            events.publishEvent(new WorkItemEvents.WorkItemMentioned(
                    workItemId, comment.getId(), actorId, mentions, now));   // CMT-2
        }
        return SubResourceDtos.CommentResponse.from(comment);
    }

    @Transactional(readOnly = true)
    public List<SubResourceDtos.CommentResponse> list(Long workItemId) {
        return commentMapper.findByWorkItem(workItemId).stream()
                .map(SubResourceDtos.CommentResponse::from).toList();
    }
}
