package com.therecommerce.workmap.admin.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.admin.domain.Form;
import com.therecommerce.workmap.admin.dto.AdminDtos;
import com.therecommerce.workmap.admin.mapper.FormMapper;
import com.therecommerce.workmap.admin.mapper.IssueTypeMapper;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.service.WorkItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * AdminFormService 단위테스트 (WMP-ADM-005): 생성 참조검증/없는양식 가드/제출 위임(WorkItemService.create).
 */
@ExtendWith(MockitoExtension.class)
class AdminFormServiceTest {

    @Mock FormMapper formMapper;
    @Mock ProjectMapper projectMapper;
    @Mock IssueTypeMapper issueTypeMapper;
    @Mock WorkItemService workItemService;
    AdminFormService service;

    @BeforeEach
    void setUp() {
        service = new AdminFormService(formMapper, projectMapper, issueTypeMapper, workItemService);
    }

    @Test
    @DisplayName("생성_유효참조_저장됨")
    void 생성_성공() {
        when(projectMapper.findById(1L)).thenReturn(Project.builder().id(1L).build());
        when(issueTypeMapper.existsByCode("BUG")).thenReturn(true);
        AdminDtos.FormRequest req =
                new AdminDtos.FormRequest(1L, "BUG", "버그제보", "[{\"key\":\"title\"}]", false);

        AdminDtos.FormResponse res = service.create(req);

        assertThat(res.issueTypeCode()).isEqualTo("BUG");
        verify(formMapper).insert(any(Form.class));
    }

    @Test
    @DisplayName("생성_없는유형_거부됨")
    void 생성_유형검증() {
        when(projectMapper.findById(1L)).thenReturn(Project.builder().id(1L).build());
        when(issueTypeMapper.existsByCode("ZZZ")).thenReturn(false);

        assertThatThrownBy(() -> service.create(
                new AdminDtos.FormRequest(1L, "ZZZ", "x", "[]", false)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.ISSUE_TYPE_NOT_FOUND);
        verify(formMapper, never()).insert(any());
    }

    @Test
    @DisplayName("삭제_없는양식_NOT_FOUND")
    void 삭제_없음() {
        when(formMapper.findById(404L)).thenReturn(null);

        assertThatThrownBy(() -> service.delete(404L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.FORM_NOT_FOUND);
    }

    @Test
    @DisplayName("제출_양식정의로work_item생성위임_제출자가reporter")
    void 제출_위임() {
        when(formMapper.findById(5L)).thenReturn(
                Form.builder().id(5L).projectId(1L).issueTypeCode("BUG").build());
        when(workItemService.create(any(), eq(99L)))
                .thenReturn(mock(WorkItemDtos.Response.class));

        service.submit(5L, new AdminDtos.FormSubmitRequest("로그인 에러", "재현됨"), 99L);

        ArgumentCaptor<WorkItemDtos.CreateRequest> cap =
                ArgumentCaptor.forClass(WorkItemDtos.CreateRequest.class);
        verify(workItemService).create(cap.capture(), eq(99L));
        WorkItemDtos.CreateRequest sent = cap.getValue();
        assertThat(sent.projectId()).isEqualTo(1L);
        assertThat(sent.issueType()).isEqualTo("BUG");
        assertThat(sent.title()).isEqualTo("로그인 에러");
        assertThat(sent.reporterId()).isEqualTo(99L);   // 제출자가 reporter
    }

    @Test
    @DisplayName("제출_없는양식_NOT_FOUND")
    void 제출_없음() {
        when(formMapper.findById(404L)).thenReturn(null);

        assertThatThrownBy(() -> service.submit(404L,
                new AdminDtos.FormSubmitRequest("t", null), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.FORM_NOT_FOUND);
        verify(workItemService, never()).create(any(), any());
    }
}
