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
    // @MapperScan(메인 앱)이 슬라이스에도 적용되므로 MyBatis 매퍼 빈을 목으로 대체
    @MockBean com.therecommerce.workmap.user.mapper.UserMapper userMapper;
    @MockBean com.therecommerce.workmap.workspace.mapper.WorkspaceMapper workspaceMapper;
    @MockBean com.therecommerce.workmap.project.mapper.ProjectMapper projectMapper;
    @MockBean com.therecommerce.workmap.project.mapper.ProjectTemplateMapper projectTemplateMapper;
    @MockBean com.therecommerce.workmap.member.mapper.ProjectMemberMapper projectMemberMapper;

    @Test
    @DisplayName("C-PRJ: POST /projects 201 + id + active_tabs 템플릿 복사")
    void POST_projects_201() throws Exception {
        ProjectDtos.CreateRequest req = new ProjectDtos.CreateRequest(
                5L, "ZGOH", "재고관리", 1L, null, null, null, null);
        ProjectDtos.Response created = new ProjectDtos.Response(
                100L, 5L, "ZGOH", "재고관리", 1L, "PLANNING", "PUBLIC", 10L,
                List.of("backlog", "board", "list"), null, null, null, 99L, null, OffsetDateTime.now());
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
}
