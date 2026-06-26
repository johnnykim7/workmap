package com.therecommerce.workmap.view.dto;

import com.therecommerce.workmap.view.domain.SavedFilter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

/** 저장 필터 API DTO(T3-2 I, WMP-VIEW-004, CR-012). */
public final class SavedFilterDtos {

    private SavedFilterDtos() {}

    /** 생성 요청. query는 목록 필터 조건 JSON(유형·상태·담당자·우선순위·라벨·스프린트·검색어 등). */
    public record CreateRequest(
            @NotBlank String name,
            @NotNull String query,
            boolean shared
    ) {}

    /** 수정 요청(소유자만). */
    public record UpdateRequest(
            @NotBlank String name,
            @NotNull String query,
            boolean shared
    ) {}

    /** 응답. mine=뷰어가 소유자인지(공유받은 것과 구분 표시용). */
    public record Response(
            Long id,
            Long ownerId,
            String name,
            String query,
            boolean shared,
            boolean mine,
            OffsetDateTime createdAt
    ) {
        public static Response from(SavedFilter f, Long viewerId) {
            return new Response(f.getId(), f.getOwnerId(), f.getName(), f.getQuery(),
                    f.isShared(), f.getOwnerId().equals(viewerId), f.getCreatedAt());
        }
    }
}
