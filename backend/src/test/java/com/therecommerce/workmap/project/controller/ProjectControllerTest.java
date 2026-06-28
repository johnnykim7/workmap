package com.therecommerce.workmap.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.therecommerce.workmap.project.dto.ProjectDtos;
import com.therecommerce.workmap.project.service.ProjectService;
import com.therecommerce.workmap.test.MethodSecurityTestConfig;
import com.therecommerce.workmap.test.WmpAuth;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ProjectController 생성 Happy Path (T3-5 C-PRJ): POST /projects → 201 + id + active_tabs 템플릿 복사.
 */
@WebMvcTest(controllers = ProjectController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.REGEX,
                pattern = "com\\.therecommerce\\.workmap\\.common\\.security\\..*"))
@AutoConfigureMockMvc(addFilters = false)
@Import(MethodSecurityTestConfig.class)
class ProjectControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean ProjectService projectService;
    @MockBean com.therecommerce.workmap.project.service.ProjectTabService projectTabService;  // CR-020
    // @MapperScan(메인 앱)이 슬라이스에도 적용되므로 MyBatis 매퍼 빈을 목으로 대체
    @MockBean com.therecommerce.workmap.user.mapper.UserMapper userMapper;
    @MockBean com.therecommerce.workmap.workspace.mapper.WorkspaceMapper workspaceMapper;
    @MockBean com.therecommerce.workmap.workspace.mapper.WorkspaceMemberMapper workspaceMemberMapper;
    @MockBean com.therecommerce.workmap.project.mapper.ProjectMapper projectMapper;
    @MockBean com.therecommerce.workmap.project.mapper.ProjectTemplateMapper projectTemplateMapper;
    @MockBean com.therecommerce.workmap.member.mapper.ProjectMemberMapper projectMemberMapper;
    @MockBean com.therecommerce.workmap.workitem.mapper.WorkItemMapper workItemMapper;
    @MockBean com.therecommerce.workmap.workitem.mapper.CommentMapper commentMapper;
    @MockBean com.therecommerce.workmap.workitem.mapper.AttachmentMapper attachmentMapper;
    @MockBean com.therecommerce.workmap.workitem.mapper.ActivityLogMapper activityLogMapper;
    @MockBean com.therecommerce.workmap.workflow.mapper.WorkflowMapper workflowMapper;
    @MockBean com.therecommerce.workmap.measure.mapper.MeasureUnitMapper measureUnitMapper;
    @MockBean com.therecommerce.workmap.notification.mapper.NotificationMapper notificationMapper;
    @MockBean com.therecommerce.workmap.agile.mapper.SprintMapper sprintMapper;
    @MockBean com.therecommerce.workmap.approval.mapper.ApprovalMapper approvalMapper;
    @MockBean com.therecommerce.workmap.workitem.mapper.WorkItemLinkMapper workItemLinkMapper;
    // Sprint 5 신규 매퍼(@MapperScan이 슬라이스에도 적용되므로 목으로 대체)
    @MockBean com.therecommerce.workmap.dashboard.mapper.DashboardMapper dashboardMapper;
    @MockBean com.therecommerce.workmap.admin.mapper.FieldSchemeMapper fieldSchemeMapper;
    @MockBean com.therecommerce.workmap.admin.mapper.AdminWorkflowMapper adminWorkflowMapper;
    // P2 신규 매퍼(@MapperScan이 슬라이스에도 적용되므로 목으로 대체)
    @MockBean com.therecommerce.workmap.admin.mapper.IssueTypeMapper issueTypeMapper;
    @MockBean com.therecommerce.workmap.admin.mapper.FormMapper formMapper;
    @MockBean com.therecommerce.workmap.view.mapper.ViewMapper viewMapper;
    @MockBean com.therecommerce.workmap.view.mapper.SavedFilterMapper savedFilterMapper;
    @MockBean com.therecommerce.workmap.burndown.mapper.BurndownMapper burndownMapper;
    @MockBean com.therecommerce.workmap.ops.mapper.FieldVerificationMapper fieldVerificationMapper;
    // CR-020 신규 매퍼(@MapperScan이 슬라이스에도 적용되므로 목으로 대체)
    @MockBean com.therecommerce.workmap.project.mapper.TabMapper tabMapper;
    // 채팅 신규 매퍼(@MapperScan이 슬라이스에도 적용되므로 목으로 대체 — CR-025)
    @MockBean com.therecommerce.workmap.chat.mapper.ChatChannelMapper chatChannelMapper;
    @MockBean com.therecommerce.workmap.chat.mapper.ChatChannelMemberMapper chatChannelMemberMapper;
    @MockBean com.therecommerce.workmap.chat.mapper.ChatMessageMapper chatMessageMapper;
    @MockBean com.therecommerce.workmap.chat.mapper.ChatReplyMapper chatReplyMapper;
    @MockBean com.therecommerce.workmap.chat.mapper.ChatReactionMapper chatReactionMapper;
    @MockBean com.therecommerce.workmap.chat.mapper.ChatReadCursorMapper chatReadCursorMapper;
    @MockBean com.therecommerce.workmap.chat.mapper.ChatPinMapper chatPinMapper;
    @MockBean com.therecommerce.workmap.chat.mapper.ChatBookmarkMapper chatBookmarkMapper;
    @MockBean com.therecommerce.workmap.chat.mapper.ChatNotificationSettingMapper chatNotificationSettingMapper;
    @MockBean com.therecommerce.workmap.chat.mapper.ChatMentionMapper chatMentionMapper;

    @Test
    @DisplayName("C-PRJ: POST /projects 201 + id + active_tabs 템플릿 복사")
    void POST_projects_201() throws Exception {
        ProjectDtos.CreateRequest req = new ProjectDtos.CreateRequest(
                5L, "ZGOH", "재고관리", 1L, null, null, null, null);
        ProjectDtos.Response created = new ProjectDtos.Response(
                100L, 5L, "ZGOH", "재고관리", 1L, "PLANNING", "PUBLIC", 10L,
                List.of("backlog", "board", "list"), null, null, null, null, 99L, null, OffsetDateTime.now());
        when(projectService.create(any(), eq(99L))).thenReturn(created);

        mockMvc.perform(post("/api/v1/projects").with(csrf()).with(WmpAuth.user(99L, "MANAGER"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(100))
                .andExpect(jsonPath("$.data.status").value("PLANNING"))
                .andExpect(jsonPath("$.data.activeTabs[0]").value("backlog"));
    }

    @Test
    @DisplayName("C-PRJ: PATCH /projects/{id} 200 + 수정된 이름·탭 반영")
    void PATCH_projects_200() throws Exception {
        ProjectDtos.UpdateRequest req = new ProjectDtos.UpdateRequest(
                "새이름", List.of("board", "list"), null, null, null, null);
        ProjectDtos.Response updated = new ProjectDtos.Response(
                100L, 5L, "ZGOH", "새이름", 1L, "ACTIVE", "PUBLIC", 10L,
                List.of("board", "list"), null, null, null, null, 99L, null, OffsetDateTime.now());
        when(projectService.update(eq(100L), any())).thenReturn(updated);

        mockMvc.perform(patch("/api/v1/projects/100").with(csrf()).with(WmpAuth.user(99L, "MANAGER"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("새이름"))
                .andExpect(jsonPath("$.data.activeTabs[0]").value("board"));
    }

    @Test
    @DisplayName("C-PRJ: PATCH /projects/{id}/archive 200 + ARCHIVED")
    void PATCH_archive_200() throws Exception {
        ProjectDtos.Response archived = new ProjectDtos.Response(
                100L, 5L, "ZGOH", "재고관리", 1L, "ARCHIVED", "PUBLIC", 10L,
                List.of("board"), null, null, null, null, 99L, OffsetDateTime.now(), OffsetDateTime.now());
        when(projectService.archive(100L)).thenReturn(archived);

        mockMvc.perform(patch("/api/v1/projects/100/archive").with(csrf()).with(WmpAuth.user(99L, "MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ARCHIVED"));
    }
}
