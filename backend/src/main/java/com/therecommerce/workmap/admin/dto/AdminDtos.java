package com.therecommerce.workmap.admin.dto;

import com.therecommerce.workmap.admin.domain.Form;
import com.therecommerce.workmap.admin.domain.IssueTypeMaster;
import com.therecommerce.workmap.measure.domain.MeasureUnit;
import com.therecommerce.workmap.workflow.domain.WorkflowStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 관리자 마스터 CRUD DTO (T3-2 H, WMP-ADM-001~003).
 * 측정단위(POL-005)/필드스킴(POL-006)/워크플로(POL-001) 편집.
 */
public final class AdminDtos {

    private AdminDtos() {}

    // ───────────────────────── 측정 단위 (WMP-ADM-001) ─────────────────────────

    public record MeasureUnitRequest(
            @NotBlank @Size(max = 40) String name,
            @NotBlank @Size(max = 20) String valueType,   // NUMBER | BOOLEAN | SELECT
            @Size(max = 20) String suffix,
            List<String> options,
            Integer sortOrder
    ) {}

    public record MeasureUnitResponse(
            Long id,
            String name,
            String valueType,
            String suffix,
            List<String> options,
            boolean isSystem,
            int sortOrder
    ) {
        public static MeasureUnitResponse from(MeasureUnit u) {
            return new MeasureUnitResponse(u.getId(), u.getName(), u.getValueType(),
                    u.getSuffix(), u.getOptions(), u.isSystem(), u.getSortOrder());
        }
    }

    // ───────────────────────── 필드 스킴 (WMP-ADM-002) ─────────────────────────

    public record FieldSchemeRequest(
            Long projectId,                                 // null = 전역 기본
            @NotBlank @Size(max = 20) String issueTypeCode,
            @NotBlank @Size(max = 40) String fieldKey,
            Boolean isVisible,
            Boolean isRequired,
            Integer sortOrder
    ) {}

    public record FieldSchemeResponse(
            Long id,
            Long projectId,
            String issueTypeCode,
            String fieldKey,
            boolean isVisible,
            boolean isRequired,
            int sortOrder
    ) {}

    // ───────────────────────── 워크플로 (WMP-ADM-003) ─────────────────────────

    public record WorkflowRequest(
            @NotBlank @Size(max = 60) String name
    ) {}

    public record WorkflowResponse(
            Long id,
            String name,
            boolean isSystem
    ) {}

    public record WorkflowStatusRequest(
            @NotBlank @Size(max = 40) String code,
            @NotBlank @Size(max = 40) String label,
            @NotBlank @Size(max = 20) String commonStatus,  // CommonStatus enum 값
            Boolean isStart,
            Boolean isDone,
            Boolean isApproval,
            @Size(max = 20) String approverRole,
            Integer sortOrder
    ) {}

    public record WorkflowStatusResponse(
            Long id,
            Long workflowId,
            String code,
            String label,
            String commonStatus,
            boolean isStart,
            boolean isDone,
            boolean isApproval,
            String approverRole,
            int sortOrder
    ) {
        public static WorkflowStatusResponse from(WorkflowStatus s) {
            return new WorkflowStatusResponse(s.getId(), s.getWorkflowId(), s.getCode(),
                    s.getLabel(), s.getCommonStatus(), s.isStart(), s.isDone(),
                    s.isApproval(), s.getApproverRole(), s.getSortOrder());
        }
    }

    public record WorkflowTransitionRequest(
            @NotNull Long fromStatusId,
            @NotNull Long toStatusId
    ) {}

    public record WorkflowTransitionResponse(
            Long id,
            Long workflowId,
            Long fromStatusId,
            Long toStatusId
    ) {}

    // ───────────────────────── 업무 유형 마스터 (WMP-ADM-004) ─────────────────────────

    public record IssueTypeRequest(
            @NotBlank @Size(max = 20) String code,   // 생성 시만 사용(update는 무시 — 식별자)
            @NotBlank @Size(max = 40) String label,
            int depth,                                // 0~2 (계층 정합성 BIZ-103)
            @Size(max = 20) String color,
            @Size(max = 40) String icon,
            Integer sortOrder
    ) {}

    public record IssueTypeResponse(
            Long id,
            String code,
            String label,
            int depth,
            String color,
            String icon,
            boolean isSystem,
            int sortOrder
    ) {
        public static IssueTypeResponse from(IssueTypeMaster t) {
            return new IssueTypeResponse(t.getId(), t.getCode(), t.getLabel(), t.getDepth(),
                    t.getColor(), t.getIcon(), t.isSystem(), t.getSortOrder());
        }
    }

    // ───────────────────────── 양식 빌더 (WMP-ADM-005) ─────────────────────────

    public record FormRequest(
            @NotNull Long projectId,
            @NotBlank @Size(max = 20) String issueTypeCode,   // 제출 시 생성할 유형
            @NotBlank @Size(max = 100) String name,
            @NotBlank String fields,                          // JSONB 원본(필드 배치/도움말/필수)
            Boolean isPublic
    ) {}

    public record FormResponse(
            Long id,
            Long projectId,
            String issueTypeCode,
            String name,
            String fields,
            boolean isPublic
    ) {
        public static FormResponse from(Form f) {
            return new FormResponse(f.getId(), f.getProjectId(), f.getIssueTypeCode(),
                    f.getName(), f.getFields(), f.isPublic());
        }
    }

    /** 양식 제출(WMP-ADM-005): 양식 정의(issue_type/project)로 work_item 생성. */
    public record FormSubmitRequest(
            @NotBlank @Size(max = 300) String title,
            String description
    ) {}
}
