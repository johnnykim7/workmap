package com.therecommerce.workmap.workspace.mapper;

import com.therecommerce.workmap.workspace.domain.Workspace;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * workspaces 테이블 MyBatis 매퍼. SQL은 resources/mapper/WorkspaceMapper.xml.
 */
@Mapper
public interface WorkspaceMapper {

    void insert(Workspace workspace);

    Workspace findById(@Param("id") Long id);

    List<Workspace> findAll();

    void update(Workspace workspace);
}
