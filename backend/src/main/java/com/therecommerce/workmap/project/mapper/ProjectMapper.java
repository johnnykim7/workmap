package com.therecommerce.workmap.project.mapper;

import com.therecommerce.workmap.project.domain.Project;
import com.therecommerce.workmap.project.dto.ProjectSummary;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * projects 테이블 MyBatis 매퍼. 목록은 가시성 권한 필터(BIZ-108) 반영 —
 * PUBLIC 또는 (PRIVATE이면서 viewer가 멤버이거나 생성자) 프로젝트만.
 */
@Mapper
public interface ProjectMapper {

    void insert(Project project);

    Project findById(@Param("id") Long id);

    boolean existsByKey(@Param("key") String key);

    /**
     * 가시성 필터 목록 (BIZ-108). 보관(archived) 제외 옵션.
     * 비공개 프로젝트는 viewer가 멤버이거나 생성자일 때만 노출.
     */
    List<Project> findVisible(
            @Param("viewerId") Long viewerId,
            @Param("workspaceId") Long workspaceId,
            @Param("status") String status,
            @Param("templateId") Long templateId,
            @Param("includeArchived") boolean includeArchived);

    /** 부분수정(WMP-WS-004): null 아닌 필드만 갱신. active_tabs는 JSONB List 핸들러. */
    void updateProject(@Param("id") Long id, @Param("p") Project p);

    void updateVisibility(@Param("id") Long id, @Param("visibility") String visibility);

    void updateStatus(@Param("id") Long id, @Param("status") String status);

    void archive(@Param("id") Long id);

    /** 프로젝트 홈 요약 집계(전체/완료/지연/막힘). 진행률은 서비스에서 계산. */
    ProjectSummary summarize(@Param("projectId") Long projectId);
}
