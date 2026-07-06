package com.therecommerce.workmap.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.ai.config.AiDraftProperties;
import com.therecommerce.workmap.ai.dto.AiDraftDtos;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.domain.ProjectTemplate;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.project.mapper.ProjectTemplateMapper;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import com.therecommerce.workmap.workitem.service.WorkItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * AiDraftService 단위테스트 (WMP-WI-019, CR-050).
 * aimbase 응답 파싱 → draft 생성(Epic / Story·Task 계층) / OPS 거부 / 미설정·상류 실패 / 초안 Epic 하위 차단.
 */
@ExtendWith(MockitoExtension.class)
class AiDraftServiceTest {

    @Mock AiDraftClient client;
    @Mock ProjectMapper projectMapper;
    @Mock ProjectTemplateMapper templateMapper;
    @Mock WorkItemMapper workItemMapper;
    @Mock WorkItemService workItemService;

    AiDraftService service;
    AiDraftProperties props;

    @BeforeEach
    void setUp() {
        props = new AiDraftProperties();
        props.setApiKey("k");
        props.setEpicWorkflowId("wf-epic");
        props.setStoryTaskWorkflowId("wf-st");
        Clock clock = Clock.fixed(Instant.parse("2026-07-07T00:00:00Z"), ZoneOffset.UTC);
        service = new AiDraftService(props, client, new ObjectMapper(),
                projectMapper, templateMapper, workItemMapper, workItemService, clock);
    }

    private Project devProject() {
        return Project.builder().id(5L).templateId(1L).build();
    }

    private ProjectTemplate template(long id, String code, List<String> codes) {
        ProjectTemplate t = new ProjectTemplate();
        t.setId(id);
        t.setCode(code);
        t.setIssueTypeCodes(codes);
        return t;
    }

    private void stubDevTemplate() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        when(templateMapper.findById(1L)).thenReturn(
                template(1L, "DEV", List.of("EPIC", "STORY", "TASK", "BUG", "SUBTASK", "DOC")));
    }

    private WorkItemDtos.Response resp(long id, String type) {
        return WorkItemDtos.Response.from(
                WorkItem.builder().id(id).issueType(type).projectId(5L).draft(true).build());
    }

    @Test
    @DisplayName("AI-1: epic 모드 — epics 배열을 파싱해 각 Epic을 draft로 생성한다")
    void epic모드_초안생성() {
        stubDevTemplate();
        when(client.runAndPoll(eq("wf-epic"), anyMap())).thenReturn(
                "{\"epics\":[{\"summary\":\"결제\",\"description\":\"d1\"},{\"summary\":\"배송\",\"description\":\"d2\"}]}");
        when(workItemService.create(any(), eq(9L), eq(true))).thenReturn(resp(101L, "EPIC"), resp(102L, "EPIC"));

        var res = service.create(5L, new AiDraftDtos.CreateRequest("서술", AiDraftDtos.Mode.epic, null), 9L);

        assertThat(res.created()).hasSize(2);
        assertThat(res.failedCount()).isZero();
        ArgumentCaptor<WorkItemDtos.CreateRequest> cap = ArgumentCaptor.forClass(WorkItemDtos.CreateRequest.class);
        verify(workItemService, times(2)).create(cap.capture(), eq(9L), eq(true));
        assertThat(cap.getAllValues()).allSatisfy(r -> {
            assertThat(r.issueType()).isEqualTo("EPIC");
            assertThat(r.projectId()).isEqualTo(5L);
        });
    }

    @Test
    @DisplayName("AI-2: story-task 모드 — 지정 Epic 하위로 Story와 그 Task를 계층 생성한다")
    void storyTask모드_계층생성() {
        stubDevTemplate();
        when(workItemMapper.findById(100L)).thenReturn(
                WorkItem.builder().id(100L).projectId(5L).issueType("EPIC").draft(false).title("결제").build());
        when(client.runAndPoll(eq("wf-st"), anyMap())).thenReturn(
                "{\"stories\":[{\"summary\":\"카드결제\",\"description\":\"s1\",\"tasks\":[{\"summary\":\"PG연동\",\"description\":\"t1\"}]}]}");
        // Story 먼저(id=200), 그 다음 Task
        when(workItemService.create(any(), eq(9L), eq(true)))
                .thenReturn(resp(200L, "STORY"), resp(201L, "TASK"));

        var res = service.create(5L, new AiDraftDtos.CreateRequest("서술", AiDraftDtos.Mode.story_task, 100L), 9L);

        assertThat(res.created()).hasSize(2);
        ArgumentCaptor<WorkItemDtos.CreateRequest> cap = ArgumentCaptor.forClass(WorkItemDtos.CreateRequest.class);
        verify(workItemService, times(2)).create(cap.capture(), eq(9L), eq(true));
        var reqs = cap.getAllValues();
        // Story: epicId=100, parentId=null
        assertThat(reqs.get(0).issueType()).isEqualTo("STORY");
        assertThat(reqs.get(0).epicId()).isEqualTo(100L);
        assertThat(reqs.get(0).parentId()).isNull();
        // Task: parentId=Story(200), epicId=100
        assertThat(reqs.get(1).issueType()).isEqualTo("TASK");
        assertThat(reqs.get(1).parentId()).isEqualTo(200L);
        assertThat(reqs.get(1).epicId()).isEqualTo(100L);
    }

    @Test
    @DisplayName("AI-3: 운영형(OPS) 템플릿은 EPIC/STORY가 없어 초안을 거부한다(WMP-7853)")
    void OPS템플릿_거부() {
        when(projectMapper.findById(5L)).thenReturn(Project.builder().id(5L).templateId(2L).build());
        when(templateMapper.findById(2L)).thenReturn(template(2L, "OPS", List.of("TASK", "BUG", "SUBTASK")));

        assertThatThrownBy(() ->
                service.create(5L, new AiDraftDtos.CreateRequest("서술", AiDraftDtos.Mode.epic, null), 9L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.AI_DRAFT_NOT_ALLOWED);
        verify(client, never()).runAndPoll(any(), any());
    }

    @Test
    @DisplayName("AI-4: 미설정(apiKey/워크플로 없음)이면 상류 호출 없이 실패 응답")
    void 미설정_실패() {
        props.setApiKey("");
        when(projectMapper.findById(5L)).thenReturn(devProject());

        assertThatThrownBy(() ->
                service.create(5L, new AiDraftDtos.CreateRequest("서술", AiDraftDtos.Mode.epic, null), 9L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.AI_DRAFT_UPSTREAM_FAILED);
    }

    @Test
    @DisplayName("AI-5: story-task 모드에서 대상 Epic이 아직 초안이면 하위 생성을 막는다(먼저 확정)")
    void 초안Epic_하위차단() {
        stubDevTemplate();
        when(workItemMapper.findById(100L)).thenReturn(
                WorkItem.builder().id(100L).projectId(5L).issueType("EPIC").draft(true).build());

        assertThatThrownBy(() ->
                service.create(5L, new AiDraftDtos.CreateRequest("서술", AiDraftDtos.Mode.story_task, 100L), 9L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.AI_DRAFT_NOT_ALLOWED);
        verify(client, never()).runAndPoll(any(), any());
    }

    @Test
    @DisplayName("AI-6: 개별 항목 생성 실패는 성공분만 남기고 failedCount로 보고(부분 실패)")
    void 부분실패_성공분반환() {
        stubDevTemplate();
        when(client.runAndPoll(eq("wf-epic"), anyMap())).thenReturn(
                "{\"epics\":[{\"summary\":\"A\"},{\"summary\":\"B\"}]}");
        when(workItemService.create(any(), eq(9L), eq(true)))
                .thenReturn(resp(101L, "EPIC"))
                .thenThrow(new BusinessException(WmpErrorCode.INVALID_REQUEST));

        var res = service.create(5L, new AiDraftDtos.CreateRequest("서술", AiDraftDtos.Mode.epic, null), 9L);

        assertThat(res.created()).hasSize(1);
        assertThat(res.failedCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("AI-7: 확정 — ids 지정 시 그 항목만 draft=false 전환(mapper 위임)")
    void 확정_지정id() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        when(workItemMapper.confirmDrafts(5L, List.of(101L, 102L))).thenReturn(2);

        var res = service.confirm(5L, new AiDraftDtos.ConfirmRequest(List.of(101L, 102L)));

        assertThat(res.count()).isEqualTo(2);
        verify(workItemMapper).confirmDrafts(5L, List.of(101L, 102L));
    }

    @Test
    @DisplayName("AI-8: 전체 버리기 — 프로젝트 draft 일괄 소프트 삭제(mapper 위임)")
    void 전체버리기() {
        when(projectMapper.findById(5L)).thenReturn(devProject());
        when(workItemMapper.discardDraftsByProject(eq(5L), any())).thenReturn(3);

        var res = service.discardAll(5L);

        assertThat(res.count()).isEqualTo(3);
        verify(workItemMapper).discardDraftsByProject(eq(5L), any());
    }
}
