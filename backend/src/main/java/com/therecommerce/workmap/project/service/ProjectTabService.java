package com.therecommerce.workmap.project.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.domain.TabDef;
import com.therecommerce.workmap.project.dto.ProjectTabDtos;
import com.therecommerce.workmap.project.mapper.TabMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 탭 메뉴(Jira식) — 라벨 폴백 + 이름 바꾸기/되돌리기 (CR-020).
 * 라벨 폴백 체인: project_tab_label → tab_def → code.
 * 이동·제거·기본탭은 ProjectService.update(PATCH /projects/{id})에서 처리.
 */
@Service
@RequiredArgsConstructor
public class ProjectTabService {

    private final TabMapper tabMapper;
    private final ProjectService projectService;

    /** GET /projects/{id}/tabs — active_tabs 순서대로 표시 데이터(폴백 라벨·기본탭 여부). */
    @Transactional(readOnly = true)
    public ProjectTabDtos.TabsResponse getTabs(Long projectId) {
        Project p = projectService.getEntity(projectId);

        Map<String, String> defLabel = new LinkedHashMap<>();
        for (TabDef d : tabMapper.findAllTabDefs()) {
            defLabel.put(d.getCode(), d.getLabel());
        }
        Map<String, String> override = new LinkedHashMap<>();
        for (Map<String, Object> row : tabMapper.findProjectLabels(projectId)) {
            override.put((String) row.get("tabCode"), (String) row.get("label"));
        }

        // 노출 탭 = active_tabs(없으면 summary 단독). 알 수 없는 코드는 건너뜀(유령 탭 방어).
        List<String> codes = (p.getActiveTabs() != null && !p.getActiveTabs().isEmpty())
                ? p.getActiveTabs() : List.of("summary");

        List<ProjectTabDtos.TabView> views = new ArrayList<>();
        for (String code : codes) {
            if (!defLabel.containsKey(code)) continue;   // tab_def에 없는 유령 코드 제외
            String label = override.getOrDefault(code, defLabel.get(code));
            boolean isDefault = code.equals(p.getDefaultTab());
            boolean isCustom = override.containsKey(code);
            views.add(new ProjectTabDtos.TabView(code, label, isDefault, isCustom));
        }
        return new ProjectTabDtos.TabsResponse(views, p.getDefaultTab());
    }

    /** PUT /projects/{id}/tabs/{code}/label — 이름 바꾸기(프로젝트별 오버라이드 UPSERT). */
    @Transactional
    public void rename(Long projectId, String tabCode, String label) {
        projectService.getEntity(projectId);   // 존재 확인(PROJECT_NOT_FOUND)
        if (!tabMapper.tabDefExists(tabCode)) {
            throw new BusinessException(WmpErrorCode.TAB_NOT_FOUND, "알 수 없는 탭: " + tabCode);
        }
        if (label == null || label.isBlank() || label.length() > 60) {
            throw new BusinessException(WmpErrorCode.TAB_LABEL_INVALID, "탭 이름은 1~60자여야 합니다.");
        }
        tabMapper.upsertLabel(projectId, tabCode, label.trim());
    }

    /** DELETE /projects/{id}/tabs/{code}/label — 이름 되돌리기(오버라이드 삭제→기본값 폴백). */
    @Transactional
    public void resetLabel(Long projectId, String tabCode) {
        projectService.getEntity(projectId);
        tabMapper.deleteLabel(projectId, tabCode);
    }
}
