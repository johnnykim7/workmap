package com.therecommerce.workmap.project.mapper;

import com.therecommerce.workmap.project.domain.ProjectTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * project_template 마스터 읽기 매퍼. 템플릿 CRUD 화면은 없고(BIZ-107, DB/Flyway 직접),
 * 프로젝트 생성 시 기본값 복사·목록 조회용으로만 사용.
 */
@Mapper
public interface ProjectTemplateMapper {

    ProjectTemplate findById(@Param("id") Long id);

    List<ProjectTemplate> findAll();
}
