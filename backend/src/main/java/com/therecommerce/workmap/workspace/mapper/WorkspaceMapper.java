package com.therecommerce.workmap.workspace.mapper;

import com.therecommerce.workmap.workspace.domain.Workspace;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * workspaces 테이블 MyBatis 매퍼. SQL은 resources/mapper/WorkspaceMapper.xml.
 */
@Mapper
public interface WorkspaceMapper {

    void insert(Workspace workspace);

    Workspace findById(@Param("id") Long id);

    List<Workspace> findAll();

    /** 내가 속한 WS만 (BIZ-112 격리, WMP-WS-008 선택 가능 목록). */
    List<Workspace> findByMember(@Param("userId") Long userId);

    void update(Workspace workspace);

    /** WS 보관/해제 (WMP-WS-011, CR-046). status는 서비스 FSM 가드 통과 후 호출. */
    void updateStatus(@Param("id") Long id,
                      @Param("status") String status,
                      @Param("archivedAt") OffsetDateTime archivedAt);
}
