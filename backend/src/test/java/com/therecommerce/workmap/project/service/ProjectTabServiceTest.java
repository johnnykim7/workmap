package com.therecommerce.workmap.project.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.domain.TabDef;
import com.therecommerce.workmap.project.dto.ProjectTabDtos;
import com.therecommerce.workmap.project.mapper.TabMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * ProjectTabService 단위테스트 (CR-020) — 라벨 폴백 체인 / 이름 바꾸기 검증 / 되돌리기.
 */
@ExtendWith(MockitoExtension.class)
class ProjectTabServiceTest {

    @Mock TabMapper tabMapper;
    @Mock ProjectService projectService;

    @InjectMocks ProjectTabService service;

    private List<TabDef> defs() {
        return List.of(
                TabDef.builder().code("summary").label("요약").sortOrder(1).build(),
                TabDef.builder().code("board").label("보드").sortOrder(3).build(),
                TabDef.builder().code("calendar").label("캘린더").sortOrder(6).build());
    }

    private Project project(List<String> tabs, String defaultTab) {
        return Project.builder().id(10L).activeTabs(tabs).defaultTab(defaultTab).build();
    }

    @Test
    void 탭조회_오버라이드없으면_기본라벨폴백() {
        when(projectService.getEntity(10L)).thenReturn(project(List.of("summary", "board"), null));
        when(tabMapper.findAllTabDefs()).thenReturn(defs());
        when(tabMapper.findProjectLabels(10L)).thenReturn(List.of());

        ProjectTabDtos.TabsResponse res = service.getTabs(10L);

        assertThat(res.tabs()).extracting("code", "label", "isCustom")
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("summary", "요약", false),
                        org.assertj.core.groups.Tuple.tuple("board", "보드", false));
    }

    @Test
    void 탭조회_오버라이드있으면_커스텀라벨우선() {
        when(projectService.getEntity(10L)).thenReturn(project(List.of("summary", "board"), "board"));
        when(tabMapper.findAllTabDefs()).thenReturn(defs());
        when(tabMapper.findProjectLabels(10L)).thenReturn(
                List.of(Map.of("tabCode", "board", "label", "개발보드")));

        ProjectTabDtos.TabsResponse res = service.getTabs(10L);

        ProjectTabDtos.TabView board = res.tabs().stream()
                .filter(t -> t.code().equals("board")).findFirst().orElseThrow();
        assertThat(board.label()).isEqualTo("개발보드");
        assertThat(board.isCustom()).isTrue();
        assertThat(board.isDefault()).isTrue();   // defaultTab == board
    }

    @Test
    void 탭조회_유령코드는_제외됨() {
        when(projectService.getEntity(10L)).thenReturn(project(List.of("summary", "issues"), null));
        when(tabMapper.findAllTabDefs()).thenReturn(defs());
        when(tabMapper.findProjectLabels(10L)).thenReturn(List.of());

        ProjectTabDtos.TabsResponse res = service.getTabs(10L);

        assertThat(res.tabs()).extracting("code").containsExactly("summary");  // issues 제외
    }

    @Test
    void 이름바꾸기_알수없는탭_거부됨() {
        when(projectService.getEntity(10L)).thenReturn(project(List.of("summary"), null));
        when(tabMapper.tabDefExists("xxx")).thenReturn(false);

        assertThatThrownBy(() -> service.rename(10L, "xxx", "라벨"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.TAB_NOT_FOUND);
    }

    @Test
    void 이름바꾸기_빈라벨_거부됨() {
        when(projectService.getEntity(10L)).thenReturn(project(List.of("summary"), null));
        when(tabMapper.tabDefExists("board")).thenReturn(true);

        assertThatThrownBy(() -> service.rename(10L, "board", "  "))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.TAB_LABEL_INVALID);
    }

    @Test
    void 이름바꾸기_정상_UPSERT호출() {
        when(projectService.getEntity(10L)).thenReturn(project(List.of("summary", "board"), null));
        when(tabMapper.tabDefExists("board")).thenReturn(true);

        service.rename(10L, "board", "개발보드");

        verify(tabMapper).upsertLabel(10L, "board", "개발보드");
    }

    @Test
    void 되돌리기_삭제호출() {
        when(projectService.getEntity(10L)).thenReturn(project(List.of("summary", "board"), null));

        service.resetLabel(10L, "board");

        verify(tabMapper).deleteLabel(10L, "board");
    }
}
