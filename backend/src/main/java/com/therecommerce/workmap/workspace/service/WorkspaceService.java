package com.therecommerce.workmap.workspace.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.user.service.UserService;
import com.therecommerce.workmap.workspace.domain.Workspace;
import com.therecommerce.workmap.workspace.domain.WorkspaceMember;
import com.therecommerce.workmap.workspace.domain.WorkspaceStatus;
import com.therecommerce.workmap.workspace.dto.WorkspaceDtos;
import com.therecommerce.workmap.workspace.mapper.WorkspaceMapper;
import com.therecommerce.workmap.workspace.mapper.WorkspaceMemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
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
        ws.setStatus(WorkspaceStatus.ACTIVE.name());   // DB default와 정합 — Response에 반영(CR-046)
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

    /**
     * WS 보관 (WMP-WS-011, 소프트 동결 BIZ-113). FSM 가드 경유 — ACTIVE→ARCHIVED만.
     * 하위 프로젝트·채널·멤버십은 건드리지 않는다(동결). 목록에서 자동 제외.
     */
    @Transactional
    public WorkspaceDtos.Response archive(Long id) {
        Workspace ws = getEntity(id);
        WorkspaceStatus from = currentStatus(ws);
        if (from == WorkspaceStatus.ARCHIVED) {
            throw new BusinessException(WmpErrorCode.WORKSPACE_ALREADY_ARCHIVED);
        }
        assertTransition(from, WorkspaceStatus.ARCHIVED);
        OffsetDateTime now = OffsetDateTime.now();
        workspaceMapper.updateStatus(id, WorkspaceStatus.ARCHIVED.name(), now);
        ws.setStatus(WorkspaceStatus.ARCHIVED.name());
        ws.setArchivedAt(now);
        return WorkspaceDtos.Response.from(ws);
    }

    /** WS 보관 해제 (WMP-WS-011). FSM 가드 경유 — ARCHIVED→ACTIVE만. archived_at은 null 복원. */
    @Transactional
    public WorkspaceDtos.Response unarchive(Long id) {
        Workspace ws = getEntity(id);
        WorkspaceStatus from = currentStatus(ws);
        assertTransition(from, WorkspaceStatus.ACTIVE);
        workspaceMapper.updateStatus(id, WorkspaceStatus.ACTIVE.name(), null);
        ws.setStatus(WorkspaceStatus.ACTIVE.name());
        ws.setArchivedAt(null);
        return WorkspaceDtos.Response.from(ws);
    }

    /** 기존 행이 status null(마이그레이션 전 데이터)일 리 없지만 방어적으로 ACTIVE 취급. */
    private WorkspaceStatus currentStatus(Workspace ws) {
        return ws.getStatus() == null ? WorkspaceStatus.ACTIVE : WorkspaceStatus.valueOf(ws.getStatus());
    }

    /** FSM 화이트리스트 위반이면 거부(BIZ-010). */
    private void assertTransition(WorkspaceStatus from, WorkspaceStatus to) {
        if (!from.canTransitionTo(to)) {
            throw new BusinessException(WmpErrorCode.WORKSPACE_ARCHIVE_INVALID_TRANSITION);
        }
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
