package com.therecommerce.workmap.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.therecommerce.workmap.user.dto.CreateUserRequest;
import com.therecommerce.workmap.user.dto.UserResponse;
import com.therecommerce.workmap.user.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * UserController 생성 Happy Path (T3-5 C-USR): POST /users → 201 + id + 이메일 누락 시 400.
 */
@WebMvcTest(controllers = UserController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.REGEX,
                pattern = "com\\.therecommerce\\.workmap\\.common\\.security\\..*"))
@AutoConfigureMockMvc(addFilters = false) // JWT 필터 제외(@PreAuthorize는 메서드 시큐리티로 검증)
@Import(com.therecommerce.workmap.test.MethodSecurityTestConfig.class)
class UserControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean UserService userService;
    // @MapperScan(메인 앱)이 슬라이스에도 적용되므로 MyBatis 매퍼 빈을 목으로 대체
    @MockBean com.therecommerce.workmap.user.mapper.UserMapper userMapper;
    @MockBean com.therecommerce.workmap.workspace.mapper.WorkspaceMapper workspaceMapper;
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

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("C-USR: POST /users 201 + id 생성")
    void POST_users_201() throws Exception {
        CreateUserRequest req = new CreateUserRequest("new@therecommerce.com", "rawPassword123", "신규", "MEMBER", null);
        UserResponse created = new UserResponse(1L, "new@therecommerce.com", "신규", "MEMBER", null, true, OffsetDateTime.now());
        when(userService.create(any())).thenReturn(created);

        mockMvc.perform(post("/api/v1/users").with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.email").value("new@therecommerce.com"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("C-USR: 이메일 누락 시 400(검증)")
    void POST_users_이메일누락_400() throws Exception {
        String body = "{\"password\":\"rawPassword123\",\"name\":\"신규\"}";

        mockMvc.perform(post("/api/v1/users").with(csrf())
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest());
    }
}
