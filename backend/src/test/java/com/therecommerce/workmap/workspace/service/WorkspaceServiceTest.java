package com.therecommerce.workmap.workspace.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.user.domain.User;
import com.therecommerce.workmap.user.service.UserService;
import com.therecommerce.workmap.workspace.domain.Workspace;
import com.therecommerce.workmap.workspace.domain.WorkspaceMember;
import com.therecommerce.workmap.workspace.dto.WorkspaceDtos;
import com.therecommerce.workmap.workspace.mapper.WorkspaceMapper;
import com.therecommerce.workmap.workspace.mapper.WorkspaceMemberMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * WorkspaceService 단위테스트 (CR-018, WMP-WS-007/008, BIZ-112).
 * WS 멤버십 격리 경계: 생성자 자동멤버·비멤버 상세 403·멤버 중복/부재·내WS만 목록.
 */
@ExtendWith(MockitoExtension.class)
class WorkspaceServiceTest {

    @Mock WorkspaceMapper workspaceMapper;
    @Mock WorkspaceMemberMapper memberMapper;
    @Mock UserService userService;

    @InjectMocks WorkspaceService workspaceService;

    private Workspace ws(Long id) {
        Workspace w = Workspace.builder().name("WMS").createdBy(7L).build();
        w.setId(id);
        return w;
    }

    @Test
    @DisplayName("WS생성_생성자_자동멤버등록(격리에서 본인 안 튕김)")
    void create_addsCreatorAsMember() {
        doAnswer(inv -> { ((Workspace) inv.getArgument(0)).setId(100L); return null; })
                .when(workspaceMapper).insert(any());

        workspaceService.create(new WorkspaceDtos.CreateRequest("WMS", null), 7L);

        ArgumentCaptor<WorkspaceMember> cap = ArgumentCaptor.forClass(WorkspaceMember.class);
        verify(memberMapper).insert(cap.capture());
        assertThat(cap.getValue().getWorkspaceId()).isEqualTo(100L);
        assertThat(cap.getValue().getUserId()).isEqualTo(7L);
    }

    @Test
    @DisplayName("WS상세_비멤버_접근거부(WORKSPACE_ACCESS_DENIED, BIZ-112)")
    void get_nonMember_denied() {
        when(workspaceMapper.findById(1L)).thenReturn(ws(1L));
        when(memberMapper.exists(1L, 99L)).thenReturn(false);

        assertThatThrownBy(() -> workspaceService.get(1L, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.WORKSPACE_ACCESS_DENIED);
    }

    @Test
    @DisplayName("WS상세_멤버_조회성공")
    void get_member_ok() {
        when(workspaceMapper.findById(1L)).thenReturn(ws(1L));
        when(memberMapper.exists(1L, 7L)).thenReturn(true);

        assertThat(workspaceService.get(1L, 7L).id()).isEqualTo(1L);
    }

    @Test
    @DisplayName("WS목록_내가_속한_WS만(BIZ-112, findByMember 경유)")
    void list_onlyMyWorkspaces() {
        when(workspaceMapper.findByMember(7L)).thenReturn(java.util.List.of(ws(1L), ws(2L)));

        assertThat(workspaceService.list(7L)).hasSize(2);
        verify(workspaceMapper).findByMember(7L);
        verify(workspaceMapper, never()).findAll();
    }

    @Test
    @DisplayName("WS멤버추가_이미멤버_중복거부(WORKSPACE_MEMBER_DUPLICATED)")
    void addMember_duplicate_rejected() {
        when(workspaceMapper.findById(1L)).thenReturn(ws(1L));
        when(userService.getEntity(5L)).thenReturn(User.builder().build());
        when(memberMapper.exists(1L, 5L)).thenReturn(true);

        assertThatThrownBy(() -> workspaceService.addMember(1L, 5L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.WORKSPACE_MEMBER_DUPLICATED);
        verify(memberMapper, never()).insert(any());
    }

    @Test
    @DisplayName("WS멤버추가_신규_성공")
    void addMember_new_ok() {
        when(workspaceMapper.findById(1L)).thenReturn(ws(1L));
        when(userService.getEntity(5L)).thenReturn(User.builder().build());
        when(memberMapper.exists(1L, 5L)).thenReturn(false);

        workspaceService.addMember(1L, 5L);

        verify(memberMapper).insert(any(WorkspaceMember.class));
    }

    @Test
    @DisplayName("WS멤버제거_없는멤버_NOT_FOUND")
    void removeMember_notFound() {
        when(workspaceMapper.findById(1L)).thenReturn(ws(1L));
        when(memberMapper.exists(1L, 5L)).thenReturn(false);

        assertThatThrownBy(() -> workspaceService.removeMember(1L, 5L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.WORKSPACE_MEMBER_NOT_FOUND);
        verify(memberMapper, never()).delete(anyLong(), anyLong());
    }
}
