package com.therecommerce.workmap.workspace.dto;

import com.therecommerce.workmap.workspace.domain.Workspace;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
            String status,
            OffsetDateTime archivedAt,
            Long createdBy,
            OffsetDateTime createdAt
    ) {
        public static Response from(Workspace w) {
            return new Response(w.getId(), w.getName(), w.getDescription(),
                    w.getStatus(), w.getArchivedAt(), w.getCreatedBy(), w.getCreatedAt());
        }
    }

    /** WS 멤버 추가 요청 (WMP-WS-007, CR-018). role 없음 — WS별 Admin 안 둠. */
    public record AddMemberRequest(
            @NotNull Long userId
    ) {}

    /** WS 멤버 응답 — 멤버 + 사용자 표시 정보 조인(MemberDtos.Response 패턴). */
    public record MemberResponse(
            Long userId,
            String name,
            String email,
            OffsetDateTime createdAt
    ) {}
}
