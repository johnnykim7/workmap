package com.therecommerce.workmap.member.dto;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

/**
 * 프로젝트 멤버 요청/응답 DTO (T3-2 E). Response는 멤버 + 사용자 표시 정보 조인.
 */
public final class MemberDtos {

    private MemberDtos() {}

    public record InviteRequest(
            @NotNull Long userId,
            String role
    ) {
        public String roleOrDefault() {
            return (role == null || role.isBlank()) ? "MEMBER" : role;
        }
    }

    public record Response(
            Long userId,
            String name,
            String email,
            String role,
            String avatarUrl,
            OffsetDateTime createdAt
    ) {}
}
