package com.therecommerce.workmap.project.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.member.domain.ProjectMember;
import com.therecommerce.workmap.member.mapper.ProjectMemberMapper;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.domain.ProjectTemplate;
import com.therecommerce.workmap.project.dto.ProjectDtos;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.project.mapper.ProjectTemplateMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * ProjectService 단위테스트 (T3-5 PRJ-1/3/4/5 + 생성자 MANAGER 멤버 자동등록).
 */
@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock ProjectMapper projectMapper;
    @Mock ProjectTemplateMapper templateMapper;
    @Mock ProjectMemberMapper memberMapper;
    @Mock com.therecommerce.workmap.workspace.mapper.WorkspaceMemberMapper workspaceMemberMapper;

    @InjectMocks ProjectService projectService;

    private ProjectTemplate devTemplate() {
        ProjectTemplate t = new ProjectTemplate();
        t.setId(1L);
        t.setCode("DEV");
        t.setName("개발형");
        t.setDefaultWorkflowId(10L);
        t.setDefaultTabs(List.of("backlog", "board", "timeline", "list", "issues"));
        t.setIssueTypeCodes(List.of("EPIC", "STORY", "TASK", "BUG", "SUBTASK"));
        return t;
    }

    @Test
    @DisplayName("PRJ-1: 프로젝트_생성_PLANNING고정 + 템플릿 default_tabs/workflow 복사 + 생성자 MANAGER 멤버")
    void 프로젝트_생성_템플릿복사_PLANNING고정() {
        when(templateMapper.findById(1L)).thenReturn(devTemplate());
        when(projectMapper.existsByKey("ZGOH")).thenReturn(false);

        ProjectDtos.CreateRequest req = new ProjectDtos.CreateRequest(
                5L, "ZGOH", "재고관리", 1L, null, null, null, null);

        ProjectDtos.Response res = projectService.create(req, 99L);

        ArgumentCaptor<Project> pc = ArgumentCaptor.forClass(Project.class);
        verify(projectMapper).insert(pc.capture());
        Project saved = pc.getValue();
        assertThat(saved.getStatus()).isEqualTo("PLANNING");        // PLANNING 고정
        assertThat(saved.getWorkflowId()).isEqualTo(10L);            // 템플릿 default_workflow 복사
        assertThat(saved.getActiveTabs()).containsExactly("backlog", "board", "timeline", "list", "issues");
        assertThat(saved.getVisibility()).isEqualTo("PUBLIC");
        assertThat(saved.getCreatedBy()).isEqualTo(99L);

        // 생성자를 MANAGER 멤버로 자동 등록
        ArgumentCaptor<ProjectMember> mc = ArgumentCaptor.forClass(ProjectMember.class);
        verify(memberMapper).insert(mc.capture());
        assertThat(mc.getValue().getUserId()).isEqualTo(99L);
        assertThat(mc.getValue().getRole()).isEqualTo("MANAGER");

        assertThat(res.key()).isEqualTo("ZGOH");
    }

    @Test
    @DisplayName("PRJ: 키중복_생성_거부")
    void 키중복_생성_거부() {
        when(templateMapper.findById(1L)).thenReturn(devTemplate());
        when(projectMapper.existsByKey("ZGOH")).thenReturn(true);

        ProjectDtos.CreateRequest req = new ProjectDtos.CreateRequest(
                5L, "ZGOH", "재고관리", 1L, null, null, null, null);

        assertThatThrownBy(() -> projectService.create(req, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.PROJECT_KEY_DUPLICATED);
        verify(projectMapper, never()).insert(any());
        verify(memberMapper, never()).insert(any());
    }

    @Test
    @DisplayName("PRJ-4: PLANNING→ARCHIVED 전이 거부(화이트리스트 위반)")
    void 상태전이_PLANNING_ARCHIVED_거부() {
        Project p = Project.builder().id(3L).status("PLANNING").build();
        when(projectMapper.findById(3L)).thenReturn(p);

        assertThatThrownBy(() -> projectService.changeStatus(3L, "ARCHIVED"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.TRANSITION_NOT_ALLOWED);
        verify(projectMapper, never()).updateStatus(anyLong(), anyString());
        verify(projectMapper, never()).archive(anyLong());
    }

    @Test
    @DisplayName("PRJ-5: ARCHIVED→ACTIVE 보관 해제 성공")
    void 상태전이_보관해제_성공() {
        Project archived = Project.builder().id(4L).status("ARCHIVED").build();
        Project active = Project.builder().id(4L).status("ACTIVE").build();
        when(projectMapper.findById(4L)).thenReturn(archived, active);

        projectService.changeStatus(4L, "ACTIVE");

        verify(projectMapper).updateStatus(4L, "ACTIVE");
    }

    @Test
    @DisplayName("WMP-WS-004: 프로젝트_부분수정_탭조합·이름 갱신")
    void 프로젝트_부분수정_갱신() {
        Project existing = Project.builder().id(7L).status("ACTIVE").name("기존").build();
        Project updated = Project.builder().id(7L).status("ACTIVE").name("새이름")
                .activeTabs(List.of("board", "list")).build();
        when(projectMapper.findById(7L)).thenReturn(existing, updated);

        ProjectDtos.UpdateRequest req = new ProjectDtos.UpdateRequest(
                "새이름", List.of("summary", "board", "list"), null, null, null, null);

        ProjectDtos.Response res = projectService.update(7L, req);

        ArgumentCaptor<Project> pc = ArgumentCaptor.forClass(Project.class);
        verify(projectMapper).updateProject(eq(7L), pc.capture());
        assertThat(pc.getValue().getName()).isEqualTo("새이름");
        assertThat(pc.getValue().getActiveTabs()).containsExactly("summary", "board", "list");
        assertThat(res.name()).isEqualTo("새이름");
    }

    @Test
    @DisplayName("WMP-WS-004: 없는_프로젝트_수정_NOT_FOUND")
    void 프로젝트_수정_없음_거부() {
        when(projectMapper.findById(404L)).thenReturn(null);

        ProjectDtos.UpdateRequest req = new ProjectDtos.UpdateRequest(
                "x", null, null, null, null, null);

        assertThatThrownBy(() -> projectService.update(404L, req))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.PROJECT_NOT_FOUND);
        verify(projectMapper, never()).updateProject(anyLong(), any());
    }

    @Test
    @DisplayName("WMP-WS-004: ACTIVE_프로젝트_보관_성공(FSM 허용)")
    void 프로젝트_보관_성공() {
        Project active = Project.builder().id(8L).status("ACTIVE").build();
        Project archived = Project.builder().id(8L).status("ARCHIVED").build();
        when(projectMapper.findById(8L)).thenReturn(active, archived);

        ProjectDtos.Response res = projectService.archive(8L);

        verify(projectMapper).archive(8L);
        assertThat(res.status()).isEqualTo("ARCHIVED");
    }

    @Test
    @DisplayName("PRJ-4: PLANNING_프로젝트_보관_거부(FSM 위반)")
    void 프로젝트_보관_PLANNING_거부() {
        Project planning = Project.builder().id(9L).status("PLANNING").build();
        when(projectMapper.findById(9L)).thenReturn(planning);

        assertThatThrownBy(() -> projectService.archive(9L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.TRANSITION_NOT_ALLOWED);
        verify(projectMapper, never()).archive(anyLong());
    }
}
