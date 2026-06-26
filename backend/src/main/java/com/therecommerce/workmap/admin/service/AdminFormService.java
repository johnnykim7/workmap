package com.therecommerce.workmap.admin.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.workmap.admin.domain.Form;
import com.therecommerce.workmap.admin.dto.AdminDtos;
import com.therecommerce.workmap.admin.mapper.FormMapper;
import com.therecommerce.workmap.admin.mapper.IssueTypeMapper;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.project.mapper.ProjectMapper;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.service.WorkItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 양식 빌더 CRUD + 제출 (WMP-ADM-005, Phase 2).
 *
 * <p>CRUD: 관리자가 양식(제출 시 생성할 유형/필드 배치)을 정의한다. fields는 JSONB 원본 패스스루.
 * 가드: project/issue_type 존재 검증.
 *
 * <p>제출(submit): 양식 정의(project_id/issue_type_code)로 work_item을 생성한다 —
 * WorkItemService.create에 위임해 key 채번·시작상태 고정·이벤트 발행을 그대로 탄다(BIZ-106 단일 테이블).
 */
@Service
@RequiredArgsConstructor
public class AdminFormService {

    private final FormMapper formMapper;
    private final ProjectMapper projectMapper;
    private final IssueTypeMapper issueTypeMapper;
    private final WorkItemService workItemService;

    @Transactional(readOnly = true)
    public PageResponse<AdminDtos.FormResponse> list(Long projectId, PageRequest page) {
        List<AdminDtos.FormResponse> items = formMapper
                .findAll(projectId, page.getPageSize(), page.getOffset())
                .stream().map(AdminDtos.FormResponse::from).toList();
        long total = formMapper.countAll(projectId);
        return PageResponse.of(items, total, page);
    }

    @Transactional(readOnly = true)
    public AdminDtos.FormResponse get(Long id) {
        return AdminDtos.FormResponse.from(mustFind(id));
    }

    @Transactional
    public AdminDtos.FormResponse create(AdminDtos.FormRequest req) {
        validateRefs(req.projectId(), req.issueTypeCode());
        Form form = Form.builder()
                .projectId(req.projectId())
                .issueTypeCode(req.issueTypeCode())
                .name(req.name())
                .fields(req.fields())
                .isPublic(Boolean.TRUE.equals(req.isPublic()))
                .build();
        formMapper.insert(form);
        return AdminDtos.FormResponse.from(form);
    }

    @Transactional
    public AdminDtos.FormResponse update(Long id, AdminDtos.FormRequest req) {
        Form form = mustFind(id);
        validateRefs(req.projectId(), req.issueTypeCode());
        // project_id는 양식 정체성 — 변경하지 않는다(유형/이름/필드/공개여부만)
        form.setIssueTypeCode(req.issueTypeCode());
        form.setName(req.name());
        form.setFields(req.fields());
        form.setPublic(Boolean.TRUE.equals(req.isPublic()));
        formMapper.update(form);
        return AdminDtos.FormResponse.from(mustFind(id));
    }

    @Transactional
    public void delete(Long id) {
        mustFind(id);
        formMapper.delete(id);
    }

    /**
     * 양식 제출(WMP-ADM-005): 양식 정의로 work_item 생성. 제출자(actorId)가 reporter가 된다.
     * 생성 로직은 WorkItemService.create로 위임(단일 진실 소스).
     */
    @Transactional
    public WorkItemDtos.Response submit(Long formId, AdminDtos.FormSubmitRequest req, Long actorId) {
        Form form = mustFind(formId);
        WorkItemDtos.CreateRequest create = new WorkItemDtos.CreateRequest(
                form.getProjectId(), form.getIssueTypeCode(),
                null, null,                          // parentId, epicId
                req.title(), req.description(),
                null, null, actorId, null,           // priority, assigneeId, reporterId(=제출자), sprintId
                null, null, null, null,              // storyPoints, estimateHours, startDate, dueDate
                null, null, null,                    // measureUnitId, targetValue, currentValue
                null, null, null, null, null, null,  // acceptanceCriteria, stepsToReproduce, expected/actual/env/severity
                null, null, null);                   // checklist, labels, relatedSolutions
        return workItemService.create(create, actorId);
    }

    private Form mustFind(Long id) {
        Form form = formMapper.findById(id);
        if (form == null) {
            throw new BusinessException(WmpErrorCode.FORM_NOT_FOUND);
        }
        return form;
    }

    private void validateRefs(Long projectId, String issueTypeCode) {
        if (projectId == null || projectMapper.findById(projectId) == null) {
            throw new BusinessException(WmpErrorCode.PROJECT_NOT_FOUND);
        }
        if (issueTypeCode == null || !issueTypeMapper.existsByCode(issueTypeCode.trim().toUpperCase())) {
            throw new BusinessException(WmpErrorCode.ISSUE_TYPE_NOT_FOUND);
        }
    }
}
