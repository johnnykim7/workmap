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
import com.therecommerce.workmap.workitem.domain.IssueType;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import com.therecommerce.workmap.workitem.service.WorkItemService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * AI 업무 초안(WMP-WI-019, CR-050). aimbase 워크플로 결과(구조적 JSON)를 파싱해 draft work_item으로 생성한다.
 *
 * <p>생성은 {@link WorkItemService#create(WorkItemDtos.CreateRequest, Long, boolean)}(draft=true) 위임 —
 * BIZ-001/002·FSM·계층(BIZ-103)을 그대로 통과한다. 초안은 백로그에서만 구분표시되고 그 외 격리(BIZ-117).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiDraftService {

    private final AiDraftProperties props;
    private final AiDraftClient client;
    private final ObjectMapper om;
    private final ProjectMapper projectMapper;
    private final ProjectTemplateMapper templateMapper;
    private final WorkItemMapper workItemMapper;
    private final WorkItemService workItemService;
    private final Clock clock;

    /** 초안 생성: 서술 → aimbase → draft work_item(Epic 또는 Story+Task 트리). */
    @Transactional
    public AiDraftDtos.CreateResult create(Long projectId, AiDraftDtos.CreateRequest req, Long actorId) {
        Project project = requireProject(projectId);
        assertConfigured();
        assertAllowedTemplate(project);

        if (req.mode() == AiDraftDtos.Mode.epic) {
            return createEpics(project, req, actorId);
        }
        return createStoryTasks(project, req, actorId);
    }

    /** mode=epic: { "epics": [{summary, description}] } → 각 Epic을 draft로 생성. */
    private AiDraftDtos.CreateResult createEpics(Project project, AiDraftDtos.CreateRequest req, Long actorId) {
        String output = client.runAndPoll(props.getEpicWorkflowId(),
                Map.of("statement", req.statement()));
        List<AiDraftDtos.EpicPlan> epics = parseList(output, "epics", AiDraftDtos.EpicPlan.class);

        List<WorkItemDtos.Response> created = new ArrayList<>();
        int failed = 0;
        for (AiDraftDtos.EpicPlan e : epics) {
            try {
                created.add(createDraft(project.getId(), IssueType.EPIC, null, null,
                        e.summary(), e.description(), actorId));
            } catch (Exception ex) {
                failed++;
                log.warn("[ai-draft] Epic 초안 생성 실패(스킵). summary={} err={}", e.summary(), ex.getMessage());
            }
        }
        return new AiDraftDtos.CreateResult(created, failed);
    }

    /** mode=story-task: 지정 Epic 하위로 Story·Task draft 생성. */
    private AiDraftDtos.CreateResult createStoryTasks(Project project, AiDraftDtos.CreateRequest req, Long actorId) {
        if (req.epicId() == null) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "story-task 모드는 대상 Epic이 필요합니다.");
        }
        // 대상 Epic이 이 프로젝트의 (초안이 아닌) 정식 Epic인지 검증 — 초안 Epic 하위엔 못 붙임(먼저 확정, BIZ-117).
        var epic = workItemMapper.findById(req.epicId());
        if (epic == null || !project.getId().equals(epic.getProjectId())
                || !IssueType.EPIC.name().equals(epic.getIssueType())) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "유효한 Epic이 아닙니다.");
        }
        if (epic.isDraft()) {
            throw new BusinessException(WmpErrorCode.AI_DRAFT_NOT_ALLOWED,
                    "먼저 Epic 초안을 확정한 뒤 하위 Story/Task를 생성하세요.");
        }

        String output = client.runAndPoll(props.getStoryTaskWorkflowId(),
                Map.of("statement", req.statement(), "epicSummary", epic.getTitle()));
        List<AiDraftDtos.StoryPlan> stories = parseList(output, "stories", AiDraftDtos.StoryPlan.class);

        List<WorkItemDtos.Response> created = new ArrayList<>();
        int failed = 0;
        for (AiDraftDtos.StoryPlan s : stories) {
            WorkItemDtos.Response story;
            try {
                story = createDraft(project.getId(), IssueType.STORY, null, req.epicId(),
                        s.summary(), s.description(), actorId);
                created.add(story);
            } catch (Exception ex) {
                failed++;
                log.warn("[ai-draft] Story 초안 생성 실패(스킵). summary={} err={}", s.summary(), ex.getMessage());
                continue;
            }
            if (s.tasks() != null) {
                for (AiDraftDtos.TaskPlan t : s.tasks()) {
                    try {
                        created.add(createDraft(project.getId(), IssueType.TASK, story.id(), req.epicId(),
                                t.summary(), t.description(), actorId));
                    } catch (Exception ex) {
                        failed++;
                        log.warn("[ai-draft] Task 초안 생성 실패(스킵). summary={} err={}", t.summary(), ex.getMessage());
                    }
                }
            }
        }
        return new AiDraftDtos.CreateResult(created, failed);
    }

    /** 초안 목록(백로그 구분표시용). */
    @Transactional(readOnly = true)
    public List<WorkItemDtos.Response> list(Long projectId) {
        requireProject(projectId);
        return workItemMapper.findDraftsByProject(projectId).stream()
                .map(WorkItemDtos.Response::from).toList();
    }

    /** 초안 확정(draft→정식). ids 비었으면 전체. */
    @Transactional
    public AiDraftDtos.CountResult confirm(Long projectId, AiDraftDtos.ConfirmRequest req) {
        requireProject(projectId);
        List<Long> ids = (req == null || req.ids() == null || req.ids().isEmpty()) ? null : req.ids();
        int n = workItemMapper.confirmDrafts(projectId, ids);
        return new AiDraftDtos.CountResult(n);
    }

    /** 초안 전체 버리기(draft 소프트 삭제). */
    @Transactional
    public AiDraftDtos.CountResult discardAll(Long projectId) {
        requireProject(projectId);
        int n = workItemMapper.discardDraftsByProject(projectId, OffsetDateTime.now(clock));
        return new AiDraftDtos.CountResult(n);
    }

    // ---- 내부 헬퍼 ----

    private WorkItemDtos.Response createDraft(Long projectId, IssueType type, Long parentId, Long epicId,
                                              String title, String description, Long actorId) {
        WorkItemDtos.CreateRequest req = new WorkItemDtos.CreateRequest(
                projectId, type.name(), parentId, epicId,
                safeTitle(title), description, null, null, null, null,
                null, null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null);
        return workItemService.create(req, actorId, true);
    }

    private Project requireProject(Long projectId) {
        Project p = projectMapper.findById(projectId);
        if (p == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        return p;
    }

    private void assertConfigured() {
        if (!props.isConfigured()) {
            throw new BusinessException(WmpErrorCode.AI_DRAFT_UPSTREAM_FAILED,
                    "AI 초안 연동이 설정되어 있지 않습니다. 관리자에게 문의하세요.");
        }
    }

    /** 대상 프로젝트 템플릿이 EPIC/STORY를 허용하는지 — 운영형(OPS) 등은 거부(BIZ-117, WMP-WI-019). */
    private void assertAllowedTemplate(Project project) {
        if (project.getTemplateId() == null) {
            throw new BusinessException(WmpErrorCode.AI_DRAFT_NOT_ALLOWED);
        }
        ProjectTemplate tpl = templateMapper.findById(project.getTemplateId());
        List<String> codes = tpl == null ? null : tpl.getIssueTypeCodes();
        if (codes == null || !codes.contains(IssueType.EPIC.name()) || !codes.contains(IssueType.STORY.name())) {
            throw new BusinessException(WmpErrorCode.AI_DRAFT_NOT_ALLOWED);
        }
    }

    private static String safeTitle(String s) {
        if (s == null || s.isBlank()) {
            return "(제목 없음)";
        }
        return s.length() > 300 ? s.substring(0, 300) : s;
    }

    /** output JSON에서 지정 키(epics/stories) 배열을 파싱. 키가 없거나 배열 아니면 빈 리스트. */
    private <T> List<T> parseList(String outputJson, String key, Class<T> elemType) {
        try {
            JsonNode root = om.readTree(stripToJson(outputJson));
            JsonNode arr = root.get(key);
            if (arr == null || !arr.isArray()) {
                throw new BusinessException(WmpErrorCode.AI_DRAFT_UPSTREAM_FAILED,
                        "AI 초안 응답 형식이 올바르지 않습니다(" + key + " 배열 없음).");
            }
            List<T> out = new ArrayList<>();
            for (JsonNode n : arr) {
                out.add(om.treeToValue(n, elemType));
            }
            return out;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("[ai-draft] 응답 파싱 실패. key={} err={}", key, e.getMessage());
            throw new BusinessException(WmpErrorCode.AI_DRAFT_UPSTREAM_FAILED, "AI 초안 응답 파싱에 실패했습니다.");
        }
    }

    /**
     * LLM 출력을 순수 JSON으로 정규화. LLM이 ```json … ``` 코드블록이나 앞뒤 설명 문장을 붙이는 경우가 잦아,
     * 첫 '{'부터 마지막 '}'까지만 추출한다(가장 견고). 이미 순수 JSON이면 그대로 반환.
     */
    private static String stripToJson(String s) {
        if (s == null) {
            return "";
        }
        int start = s.indexOf('{');
        int end = s.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return s.substring(start, end + 1);
        }
        return s;
    }
}
