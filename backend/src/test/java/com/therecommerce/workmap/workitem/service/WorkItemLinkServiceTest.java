package com.therecommerce.workmap.workitem.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.workitem.domain.ActivityLog;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.domain.WorkItemLink;
import com.therecommerce.workmap.workitem.dto.LinkDtos;
import com.therecommerce.workmap.workitem.mapper.ActivityLogMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemLinkMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * WorkItemLinkService 단위테스트 (WMP-WI-013, BIZ-109): 양방향 자동 생성/자기참조·유형 가드/삭제 가드.
 */
@ExtendWith(MockitoExtension.class)
class WorkItemLinkServiceTest {

    @Mock WorkItemLinkMapper linkMapper;
    @Mock WorkItemMapper workItemMapper;
    @Mock ActivityLogMapper activityLogMapper;
    WorkItemLinkService service;

    @BeforeEach
    void setUp() {
        service = new WorkItemLinkService(linkMapper, workItemMapper, activityLogMapper);
    }

    private void existing(Long... ids) {
        for (Long id : ids) {
            when(workItemMapper.findById(id)).thenReturn(WorkItem.builder().id(id).build());
        }
    }

    @Test
    @DisplayName("링크생성_BLOCKS_정방향역방향2행저장")
    void 생성_양방향() {
        existing(1L, 2L);
        LinkDtos.CreateLinkRequest req = new LinkDtos.CreateLinkRequest("BLOCKS", 2L);

        service.create(1L, req, 99L);

        // 정방향 BLOCKS + 역방향 BLOCKED_BY
        verify(linkMapper).insert(1L, 2L, "BLOCKS");
        verify(linkMapper).insert(2L, 1L, "BLOCKED_BY");
        // 양쪽 항목에 활동 로그
        verify(activityLogMapper, times(2)).insert(any(ActivityLog.class));
    }

    @Test
    @DisplayName("링크생성_RELATES_TO_대칭저장")
    void 생성_대칭() {
        existing(1L, 2L);
        service.create(1L, new LinkDtos.CreateLinkRequest("relates_to", 2L), 99L);

        verify(linkMapper).insert(1L, 2L, "RELATES_TO");
        verify(linkMapper).insert(2L, 1L, "RELATES_TO");
    }

    @Test
    @DisplayName("링크생성_자기참조_거부됨")
    void 생성_자기참조() {
        existing(1L);
        assertThatThrownBy(() -> service.create(1L, new LinkDtos.CreateLinkRequest("BLOCKS", 1L), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.LINK_SELF_REFERENCE);
        verify(linkMapper, never()).insert(any(), any(), any());
    }

    @Test
    @DisplayName("링크생성_잘못된유형_거부됨")
    void 생성_유형검증() {
        existing(1L, 2L);
        assertThatThrownBy(() -> service.create(1L, new LinkDtos.CreateLinkRequest("FOLLOWS", 2L), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.LINK_TYPE_INVALID);
        verify(linkMapper, never()).insert(any(), any(), any());
    }

    @Test
    @DisplayName("링크생성_없는항목_NOT_FOUND")
    void 생성_없는항목() {
        when(workItemMapper.findById(1L)).thenReturn(WorkItem.builder().id(1L).build());
        when(workItemMapper.findById(2L)).thenReturn(null);

        assertThatThrownBy(() -> service.create(1L, new LinkDtos.CreateLinkRequest("BLOCKS", 2L), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.WORK_ITEM_NOT_FOUND);
    }

    @Test
    @DisplayName("링크삭제_양방향1쌍제거")
    void 삭제_양방향() {
        existing(1L);
        when(linkMapper.findById(10L)).thenReturn(
                WorkItemLink.builder().id(10L).sourceId(1L).targetId(2L).linkType("BLOCKS").build());

        service.delete(1L, 10L, 99L);

        verify(linkMapper).deletePair(1L, 2L, "BLOCKS", "BLOCKED_BY");
    }

    @Test
    @DisplayName("링크삭제_소유자불일치_NOT_FOUND")
    void 삭제_소유불일치() {
        existing(1L);
        when(linkMapper.findById(10L)).thenReturn(
                WorkItemLink.builder().id(10L).sourceId(5L).targetId(2L).linkType("BLOCKS").build());

        assertThatThrownBy(() -> service.delete(1L, 10L, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.LINK_NOT_FOUND);
        verify(linkMapper, never()).deletePair(any(), any(), any(), any());
    }
}
