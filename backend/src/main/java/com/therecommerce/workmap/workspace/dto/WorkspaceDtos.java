package com.therecommerce.workmap.workspace.dto;

import com.therecommerce.workmap.workspace.domain.Workspace;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

/**
 * 워크스페이스 요청/응답 DTO 모음 (T3-2 C).
 */
public final class WorkspaceDtos {

    private WorkspaceDtos() {}

    public record CreateRequest(
            @NotBlank @Size(max = 150) String name,
            String description
    ) {}

    public record UpdateRequest(
            @NotBlank @Size(max = 150) String name,
            String description
    ) {}

    public record Response(
            Long id,
            String name,
            String description,
            Long createdBy,
            OffsetDateTime createdAt
    ) {
        public static Response from(Workspace w) {
            return new Response(w.getId(), w.getName(), w.getDescription(), w.getCreatedBy(), w.getCreatedAt());
        }
    }
}
