package com.therecommerce.workmap.project.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.member.domain.ProjectMember;
import com.therecommerce.workmap.member.mapper.ProjectMemberMapper;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.domain.ProjectStatus;
import com.therecommerce.workmap.project.domain.ProjectTemplate;
import com.therecommerce.workmap.project.domain.Visibility;
import com.therecommerce.workmap.project.dto.ProjectDtos;
import com.therecommerce.workmap.project.dto.ProjectSummary;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.project.mapper.ProjectTemplateMapper;
import com.therecommerce.workmap.workspace.mapper.WorkspaceMemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 프로젝트 관리 (WMP-WS-002/003/006).
 * 생성: 템플릿 default_tabs→active_tabs, default_workflow_id→workflow_id 복사(PRJ-1),
 *       status=PLANNING 고정, key UNIQUE 검증(PROJECT_KEY_DUPLICATED),
 *       생성자를 MANAGER 멤버로 자동 등록(사용자 결정 2026-06-26).
 * 목록: 가시성 권한 필터(BIZ-108) — 비공개는 멤버/생성자만.
 * 상태 전이: ProjectStatus 화이트리스트만(PRJ-4 거부 / PRJ-5 허용).
 */
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectMapper projectMapper;
    private final ProjectTemplateMapper templateMapper;
    private final ProjectMemberMapper memberMapper;
    private final WorkspaceMemberMapper workspaceMemberMapper;

    @Transactional
    public ProjectDtos.Response create(ProjectDtos.CreateRequest req, Long actorId) {
        ProjectTemplate template = templateMapper.findById(req.templateId());
        if (template == null) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "존재하지 않는 프로젝트 템플릿입니다.");
        }
        if (projectMapper.existsByKey(req.key())) {
            throw new BusinessException(WmpErrorCode.PROJECT_KEY_DUPLICATED);
        }
        String visibility = (req.visibility() == null || req.visibility().isBlank())
                ? Visibility.PUBLIC.name()
                : Visibility.valueOf(req.visibility()).name();

        Project project = Project.builder()
                .workspaceId(req.workspaceId())
                .key(req.key())
                .name(req.name())
                .templateId(template.getId())
                .status(ProjectStatus.PLANNING.name())   // 생성 시 PLANNING 고정(PRJ-1)
                .visibility(visibility)
                .workflowId(template.getDefaultWorkflowId())   // 템플릿에서 복사
                .activeTabs(template.getDefaultTabs())          // 템플릿에서 복사
                .startDate(req.startDate())
                .endDate(req.endDate())
                .description(req.description())
                .createdBy(actorId)
                .build();
        projectMapper.insert(project);

        // 생성자를 MANAGER 멤버로 자동 등록 — 비공개 가시성·담당자 지정 일관성(BIZ-108)
        memberMapper.insert(ProjectMember.builder()
                .projectId(project.getId())
                .userId(actorId)
                .role("MANAGER")
                .build());

        return ProjectDtos.Response.from(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectDtos.Response> list(Long viewerId, Long workspaceId, String status,
                                           Long templateId, boolean includeArchived) {
        return projectMapper.findVisible(viewerId, workspaceId, status, templateId, includeArchived)
                .stream().map(ProjectDtos.Response::from).toList();
    }

    @Transactional(readOnly = true)
    public Project getEntity(Long id) {
        Project p = projectMapper.findById(id);
        if (p == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        return p;
    }

    @Transactional(readOnly = true)
    public ProjectDtos.Response get(Long id, Long viewerId) {
        Project p = getEntity(id);
        assertVisible(p, viewerId);
        return ProjectDtos.Response.from(p);
    }

    /** 부분수정(WMP-WS-004): 이름/탭조합/기본탭/기간/설명만. 가시성·상태는 전용 엔드포인트. */
    @Transactional
    public ProjectDtos.Response update(Long id, ProjectDtos.UpdateRequest req) {
        getEntity(id);   // 존재 확인(PROJECT_NOT_FOUND)
        // summary 가드(CR-020): 탭 조합 변경 시 summary는 항상 포함(제거·맨앞 보장 X지만 포함은 강제).
        java.util.List<String> tabs = req.activeTabs();
        if (tabs != null && !tabs.contains("summary")) {
            throw new BusinessException(WmpErrorCode.TAB_SUMMARY_LOCKED,
                    "요약(summary) 탭은 제거할 수 없습니다.");
        }
        Project patch = Project.builder()
                .name(req.name())
                .activeTabs(tabs)
                .defaultTab(req.defaultTab())
                .requireAcceptanceCriteria(req.requireAcceptanceCriteria())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .description(req.description())
                .build();
        projectMapper.updateProject(id, patch);
        return ProjectDtos.Response.from(getEntity(id));
    }

    /** 보관(WMP-WS-004, 소프트). FSM 가드 경유 — ARCHIVED 전이 화이트리스트 허용 시에만. */
    @Transactional
    public ProjectDtos.Response archive(Long id) {
        Project p = getEntity(id);
        ProjectStatus from = ProjectStatus.valueOf(p.getStatus());
        if (!from.canTransitionTo(ProjectStatus.ARCHIVED)) {
            throw new BusinessException(WmpErrorCode.TRANSITION_NOT_ALLOWED,
                    "프로젝트 보관 불허: " + from + " → ARCHIVED");
        }
        projectMapper.archive(id);
        return ProjectDtos.Response.from(getEntity(id));
    }

    @Transactional
    public ProjectDtos.Response changeVisibility(Long id, String visibility) {
        getEntity(id);
        String normalized = Visibility.valueOf(visibility).name();
        projectMapper.updateVisibility(id, normalized);
        return ProjectDtos.Response.from(getEntity(id));
    }

    @Transactional
    public ProjectDtos.Response changeStatus(Long id, String target) {
        Project p = getEntity(id);
        ProjectStatus from = ProjectStatus.valueOf(p.getStatus());
        ProjectStatus to = ProjectStatus.valueOf(target);
        if (!from.canTransitionTo(to)) {
            throw new BusinessException(WmpErrorCode.TRANSITION_NOT_ALLOWED,
                    "프로젝트 상태 전이 불허: " + from + " → " + to);
        }
        if (to == ProjectStatus.ARCHIVED) {
            projectMapper.archive(id);
        } else {
            projectMapper.updateStatus(id, to.name());
        }
        return ProjectDtos.Response.from(getEntity(id));
    }

    @Transactional(readOnly = true)
    public ProjectSummary summary(Long id, Long viewerId) {
        Project p = getEntity(id);
        assertVisible(p, viewerId);
        ProjectSummary s = projectMapper.summarize(id);
        s.setProgress(s.getTotal() == 0 ? 0 : (int) Math.round(100.0 * s.getDone() / s.getTotal()));
        return s;
    }

    /**
     * 가시성 가드 — 2단 경계(CR-018).
     * 1차(BIZ-112): 그 프로젝트의 WS 멤버가 아니면 WORKSPACE_ACCESS_DENIED(비멤버는 PUBLIC이어도 차단).
     * 2차(BIZ-108): 그 WS 안에서 비공개 프로젝트는 멤버/생성자만.
     */
    private void assertVisible(Project p, Long viewerId) {
        if (!workspaceMemberMapper.exists(p.getWorkspaceId(), viewerId)) {
            throw new BusinessException(WmpErrorCode.WORKSPACE_ACCESS_DENIED);
        }
        if (Visibility.PUBLIC.name().equals(p.getVisibility())) {
            return;
        }
        boolean allowed = p.getCreatedBy().equals(viewerId)
                || memberMapper.exists(p.getId(), viewerId);
        if (!allowed) {
            throw new BusinessException(WmpErrorCode.NOT_PROJECT_MEMBER);
        }
    }
}
