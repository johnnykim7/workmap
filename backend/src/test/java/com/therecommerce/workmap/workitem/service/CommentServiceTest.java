package com.therecommerce.workmap.workitem.service;

import com.therecommerce.workmap.common.event.WorkItemEvents;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.SubResourceDtos;
import com.therecommerce.workmap.workitem.mapper.CommentMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * CommentService 단위테스트 (T3-5 CMT-1/2). 멘션 포함 시 WorkItemMentioned 발행.
 */
@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock CommentMapper commentMapper;
    @Mock WorkItemMapper workItemMapper;
    @Mock org.springframework.context.ApplicationEventPublisher events;

    CommentService service;
    Clock clock = Clock.fixed(java.time.Instant.parse("2026-06-26T10:00:00Z"), ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        service = new CommentService(commentMapper, workItemMapper, events, clock);
    }

    @Test
    @DisplayName("CMT-1: 댓글작성_저장")
    void 댓글작성_저장() {
        when(workItemMapper.findById(1L)).thenReturn(WorkItem.builder().id(1L).build());
        service.create(1L, new SubResourceDtos.CreateCommentRequest("내용", null), 99L);
        verify(commentMapper).insert(any());
        verify(events, never()).publishEvent(any());  // 멘션 없으면 이벤트 없음
    }

    @Test
    @DisplayName("CMT-2: 멘션포함_WorkItemMentioned발행")
    void 멘션포함_이벤트발행() {
        when(workItemMapper.findById(1L)).thenReturn(WorkItem.builder().id(1L).build());
        // insert 시 id 채번 시뮬레이션
        doAnswer(inv -> {
            ((com.therecommerce.workmap.workitem.domain.Comment) inv.getArgument(0)).setId(55L);
            return null;
        }).when(commentMapper).insert(any());

        service.create(1L, new SubResourceDtos.CreateCommentRequest("@a", List.of(7L, 8L)), 99L);

        ArgumentCaptor<Object> ev = ArgumentCaptor.forClass(Object.class);
        verify(events).publishEvent(ev.capture());
        WorkItemEvents.WorkItemMentioned e = (WorkItemEvents.WorkItemMentioned) ev.getValue();
        assertThat(e.commentId()).isEqualTo(55L);       // 멱등 키=commentId
        assertThat(e.authorId()).isEqualTo(99L);
        assertThat(e.mentionedUserIds()).containsExactly(7L, 8L);
    }
}
