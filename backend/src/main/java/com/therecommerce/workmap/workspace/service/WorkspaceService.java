package com.therecommerce.workmap.workspace.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.workspace.domain.Workspace;
import com.therecommerce.workmap.workspace.dto.WorkspaceDtos;
import com.therecommerce.workmap.workspace.mapper.WorkspaceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 워크스페이스 관리 (WMP-WS-001). 생성/수정은 Admin(컨트롤러 가드).
 */
@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceMapper workspaceMapper;

    @Transactional
    public WorkspaceDtos.Response create(WorkspaceDtos.CreateRequest req, Long actorId) {
        Workspace ws = Workspace.builder()
                .name(req.name())
                .description(req.description())
                .createdBy(actorId)
                .build();
        workspaceMapper.insert(ws);
        return WorkspaceDtos.Response.from(ws);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceDtos.Response> list() {
        return workspaceMapper.findAll().stream().map(WorkspaceDtos.Response::from).toList();
    }

    @Transactional(readOnly = true)
    public Workspace getEntity(Long id) {
        Workspace ws = workspaceMapper.findById(id);
        if (ws == null) {
            throw new BusinessException(WmpErrorCode.WORKSPACE_NOT_FOUND);
        }
        return ws;
    }

    @Transactional(readOnly = true)
    public WorkspaceDtos.Response get(Long id) {
        return WorkspaceDtos.Response.from(getEntity(id));
    }

    @Transactional
    public WorkspaceDtos.Response update(Long id, WorkspaceDtos.UpdateRequest req) {
        Workspace ws = getEntity(id);
        ws.setName(req.name());
        ws.setDescription(req.description());
        workspaceMapper.update(ws);
        return WorkspaceDtos.Response.from(ws);
    }
}
