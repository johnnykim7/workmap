package com.therecommerce.workmap.workspace.mapper;

import com.therecommerce.workmap.workspace.domain.WorkspaceMember;
import com.therecommerce.workmap.workspace.dto.WorkspaceDtos;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * workspace_members 테이블 MyBatis 매퍼 (WMP-WS-007, CR-018).
 * SQL은 resources/mapper/WorkspaceMemberMapper.xml.
 */
@Mapper
public interface WorkspaceMemberMapper {

    /** 신규 멤버 추가. 이미 존재하면(PK 충돌) 무시(ON CONFLICT). */
    void insert(WorkspaceMember member);

    /** 멤버 + 사용자 정보 조인 목록. */
    List<WorkspaceDtos.MemberResponse> findByWorkspaceId(@Param("workspaceId") Long workspaceId);

    boolean exists(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

    void delete(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

    /** BIZ-112 격리: 사용자가 멤버로 속한 워크스페이스 id 목록(전 목록 API 1차 스코프). */
    List<Long> findWorkspaceIdsByUserId(@Param("userId") Long userId);
}
