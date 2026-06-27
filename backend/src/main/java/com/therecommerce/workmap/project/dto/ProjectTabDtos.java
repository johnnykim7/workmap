package com.therecommerce.workmap.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 탭 메뉴(Jira식) 요청/응답 DTO (T3-2, CR-020).
 */
public final class ProjectTabDtos {

    private ProjectTabDtos() {}

    /** 이름 바꾸기 — 프로젝트별 오버라이드 UPSERT. */
    public record RenameRequest(
            @NotBlank @Size(max = 60) String label
    ) {}

    /** 한 탭의 표시 데이터(폴백 적용된 라벨 + 기본탭 여부). */
    public record TabView(
            String code,
            String label,      // project_tab_label → tab_def → code 폴백 적용된 최종 표시명
            boolean isDefault, // projects.default_tab == code
            boolean isCustom   // project_tab_label 오버라이드가 있는지(되돌리기 노출 판단용)
    ) {}

    /** GET /projects/{id}/tabs — active_tabs 순서대로 탭 표시 데이터 목록. */
    public record TabsResponse(
            List<TabView> tabs,
            String defaultTab
    ) {}
}
