package com.therecommerce.workmap.project.dto;

import com.therecommerce.workmap.project.domain.Project;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * 프로젝트 요청/응답 DTO (T3-2 D).
 */
public final class ProjectDtos {

    private ProjectDtos() {}

    public record CreateRequest(
            @NotNull Long workspaceId,
            @NotBlank @Size(max = 10) @Pattern(regexp = "^[A-Z][A-Z0-9]{1,9}$",
                    message = "키는 대문자로 시작하는 영문 대문자/숫자 2~10자입니다.") String key,
            @NotBlank @Size(max = 200) String name,
            @NotNull Long templateId,
            String visibility,
            LocalDate startDate,
            LocalDate endDate,
            String description
    ) {}

    /**
     * 프로젝트 부분수정(WMP-WS-004, PATCH). null 필드는 미변경.
     * 탭 조합(activeTabs)·이름·설명·기간만 — 가시성/상태는 전용 엔드포인트로 분리.
     */
    public record UpdateRequest(
            @Size(max = 200) String name,
            List<String> activeTabs,
            LocalDate startDate,
            LocalDate endDate,
            String description
    ) {}

    public record UpdateVisibilityRequest(
            @NotBlank String visibility
    ) {}

    public record ChangeStatusRequest(
            @NotBlank String status
    ) {}

    public record Response(
            Long id,
            Long workspaceId,
            String key,
            String name,
            Long templateId,
            String status,
            String visibility,
            Long workflowId,
            List<String> activeTabs,
            LocalDate startDate,
            LocalDate endDate,
            String description,
            Long createdBy,
            OffsetDateTime archivedAt,
            OffsetDateTime createdAt
    ) {
        public static Response from(Project p) {
            return new Response(
                    p.getId(), p.getWorkspaceId(), p.getKey(), p.getName(), p.getTemplateId(),
                    p.getStatus(), p.getVisibility(), p.getWorkflowId(), p.getActiveTabs(),
                    p.getStartDate(), p.getEndDate(), p.getDescription(), p.getCreatedBy(),
                    p.getArchivedAt(), p.getCreatedAt());
        }
    }
}
