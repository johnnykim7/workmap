package com.therecommerce.workmap.workspace.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.user.service.UserService;
import com.therecommerce.workmap.workspace.domain.Workspace;
import com.therecommerce.workmap.workspace.domain.WorkspaceMember;
import com.therecommerce.workmap.workspace.dto.WorkspaceDtos;
import com.therecommerce.workmap.workspace.mapper.WorkspaceMapper;
import com.therecommerce.workmap.workspace.mapper.WorkspaceMemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 워크스페이스 관리 (WMP-WS-001/007/008, CR-018). 생성/수정/멤버관리는 전사 Admin(컨트롤러 가드).
 * WS = 멤버십 격리 경계(BIZ-112) — 목록은 내가 속한 WS만, 상세/멤버는 멤버만 접근.
 */
@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceMapper workspaceMapper;
    private final WorkspaceMemberMapper memberMapper;
    private final UserService userService;

    @Transactional
    public WorkspaceDtos.Response create(WorkspaceDtos.CreateRequest req, Long actorId) {
        Workspace ws = Workspace.builder()
                .name(req.name())
                .description(req.description())
                .createdBy(actorId)
                .build();
        workspaceMapper.insert(ws);
        // 생성자를 WS 멤버로 자동 등록 — 생성 직후 본인이 격리에서 튕기지 않도록(BIZ-112)
        memberMapper.insert(WorkspaceMember.builder()
                .workspaceId(ws.getId())
                .userId(actorId)
                .build());
        return WorkspaceDtos.Response.from(ws);
    }

    /** 내가 속한 WS만 (BIZ-112, WMP-WS-008 선택 가능 목록). 전사 Admin도 멤버 WS만. */
    @Transactional(readOnly = true)
    public List<WorkspaceDtos.Response> list(Long viewerId) {
        return workspaceMapper.findByMember(viewerId).stream().map(WorkspaceDtos.Response::from).toList();
    }

    @Transactional(readOnly = true)
    public Workspace getEntity(Long id) {
        Workspace ws = workspaceMapper.findById(id);
        if (ws == null) {
            throw new BusinessException(WmpErrorCode.WORKSPACE_NOT_FOUND);
        }
        return ws;
    }

    /** 상세 조회 — 비멤버는 403(BIZ-112). */
    @Transactional(readOnly = true)
    public WorkspaceDtos.Response get(Long id, Long viewerId) {
        Workspace ws = getEntity(id);
        assertMember(id, viewerId);
        return WorkspaceDtos.Response.from(ws);
    }

    @Transactional
    public WorkspaceDtos.Response update(Long id, WorkspaceDtos.UpdateRequest req) {
        Workspace ws = getEntity(id);
        ws.setName(req.name());
        ws.setDescription(req.description());
        workspaceMapper.update(ws);
        return WorkspaceDtos.Response.from(ws);
    }

    // ── WS 멤버 관리 (WMP-WS-007) — 전사 Admin만(컨트롤러 가드) ──

    @Transactional(readOnly = true)
    public List<WorkspaceDtos.MemberResponse> listMembers(Long workspaceId) {
        getEntity(workspaceId);   // 존재 검증
        return memberMapper.findByWorkspaceId(workspaceId);
    }

    @Transactional
    public void addMember(Long workspaceId, Long userId) {
        getEntity(workspaceId);       // WS 존재 검증
        userService.getEntity(userId); // 사용자 존재 검증
        if (memberMapper.exists(workspaceId, userId)) {
            throw new BusinessException(WmpErrorCode.WORKSPACE_MEMBER_DUPLICATED);
        }
        memberMapper.insert(WorkspaceMember.builder()
                .workspaceId(workspaceId)
                .userId(userId)
                .build());
    }

    @Transactional
    public void removeMember(Long workspaceId, Long userId) {
        getEntity(workspaceId);
        if (!memberMapper.exists(workspaceId, userId)) {
            throw new BusinessException(WmpErrorCode.WORKSPACE_MEMBER_NOT_FOUND);
        }
        memberMapper.delete(workspaceId, userId);
    }

    /** BIZ-112: 비멤버의 WS 접근 차단(403). */
    private void assertMember(Long workspaceId, Long viewerId) {
        if (!memberMapper.exists(workspaceId, viewerId)) {
            throw new BusinessException(WmpErrorCode.WORKSPACE_ACCESS_DENIED);
        }
    }
}
