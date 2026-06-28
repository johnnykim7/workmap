package com.therecommerce.workmap.workitem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.therecommerce.workmap.test.MethodSecurityTestConfig;
import com.therecommerce.workmap.test.WmpAuth;
import com.therecommerce.workmap.workitem.dto.SubResourceDtos;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.service.ActivityLogService;
import com.therecommerce.workmap.workitem.service.AttachmentService;
import com.therecommerce.workmap.workitem.service.CommentService;
import com.therecommerce.workmap.workitem.service.WorkItemService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * WorkItem 생성 Happy Path (T3-5 C-WI, C-CMT): POST → 201 + key 자동 + ResponseDto 직렬화.
 */
@WebMvcTest(controllers = {WorkItemController.class, WorkItemSubResourceController.class},
        excludeFilters = @ComponentScan.Filter(type = FilterType.REGEX,
                pattern = "com\\.therecommerce\\.workmap\\.common\\.security\\..*"))
@AutoConfigureMockMvc(addFilters = false)
@Import(MethodSecurityTestConfig.class)
class WorkItemControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean WorkItemService workItemService;
    @MockBean com.therecommerce.workmap.workitem.service.WorkItemQueryService workItemQueryService;
    @MockBean com.therecommerce.workmap.workitem.service.WorkItemBulkService workItemBulkService;
    @MockBean CommentService commentService;
    @MockBean AttachmentService attachmentService;
    @MockBean ActivityLogService activityLogService;
    @MockBean com.therecommerce.workmap.workitem.service.WorkItemLinkService workItemLinkService;
    // @MapperScan이 슬라이스에도 적용되므로 MyBatis 매퍼 빈을 목으로 대체
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
    @MockBean com.therecommerce.workmap.project.mapper.TabMapper tabMapper;  // CR-020
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

    private WorkItemDtos.Response sample() {
        return new WorkItemDtos.Response(
                1L, "ZGOH-5", 5L, "TASK", null, null, "제목", null, 10L, 100L, "TODO", "NORMAL",
                null, null, null, null, null, null, null, 0, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, 99L, OffsetDateTime.now());
    }

    @Test
    @DisplayName("C-WI: POST /work-items 201 + key 자동 + ResponseDto 직렬화")
    void POST_work_items_201() throws Exception {
        WorkItemDtos.CreateRequest req = new WorkItemDtos.CreateRequest(
                5L, "TASK", null, null, "제목", null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null);
        when(workItemService.create(any(), eq(99L))).thenReturn(sample());

        mockMvc.perform(post("/api/v1/work-items").with(csrf()).with(WmpAuth.user(99L, "MEMBER"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.key").value("ZGOH-5"))
                .andExpect(jsonPath("$.data.commonStatus").value("TODO"));
    }

    @Test
    @DisplayName("C-CMT: POST /work-items/{id}/comments 201 + id")
    void POST_comments_201() throws Exception {
        SubResourceDtos.CreateCommentRequest req = new SubResourceDtos.CreateCommentRequest("내용", null);
        SubResourceDtos.CommentResponse created = new SubResourceDtos.CommentResponse(
                55L, 1L, 99L, "내용", List.of(), OffsetDateTime.now());
        when(commentService.create(eq(1L), any(), eq(99L))).thenReturn(created);

        mockMvc.perform(post("/api/v1/work-items/1/comments").with(csrf()).with(WmpAuth.user(99L, "MEMBER"))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(55));
    }
}
