package com.therecommerce.workmap.workitem.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * comments 도메인(T3-1, WMP-WI-009). mentioned_user_ids는 @멘션 대상(WorkItemMentioned 발행 소스).
 */
@Getter
@Setter
@Builder
public class Comment {

    private Long id;
    private Long workItemId;
    private Long authorId;
    private String content;
    private List<Long> mentionedUserIds;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
