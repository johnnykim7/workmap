package com.therecommerce.workmap.project.mapper;

import com.therecommerce.workmap.project.domain.TabDef;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 탭 정의(tab_def) + 프로젝트별 라벨 오버라이드(project_tab_label) 매퍼 (CR-020).
 */
@Mapper
public interface TabMapper {

    /** 전역 기본 탭 정의 전체(코드→라벨 폴백의 2차 소스). */
    List<TabDef> findAllTabDefs();

    /** 특정 코드가 tab_def에 존재하는지(탭 코드 검증). */
    boolean tabDefExists(@Param("code") String code);

    /** 프로젝트별 라벨 오버라이드 목록(있는 것만 — sparse). */
    List<Map<String, Object>> findProjectLabels(@Param("projectId") Long projectId);

    /** 이름 바꾸기 — UPSERT(이미 있으면 label 갱신). */
    void upsertLabel(@Param("projectId") Long projectId,
                     @Param("tabCode") String tabCode,
                     @Param("label") String label);

    /** 이름 되돌리기 — 오버라이드 삭제(기본값 폴백). */
    void deleteLabel(@Param("projectId") Long projectId, @Param("tabCode") String tabCode);
}
