package com.therecommerce.workmap.admin.dto;

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
}
