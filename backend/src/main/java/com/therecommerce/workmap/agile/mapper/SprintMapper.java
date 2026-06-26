package com.therecommerce.workmap.agile.mapper;

import com.therecommerce.workmap.agile.domain.Sprint;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.OffsetDateTime;
import java.util.List;

@Mapper
public interface SprintMapper {

    void insert(Sprint sprint);

    Sprint findById(@Param("id") Long id);

    /** 프로젝트의 스프린트 목록(sort_order, id 순). */
    List<Sprint> findByProject(@Param("projectId") Long projectId);

    /** 프로젝트의 ACTIVE 스프린트(없으면 null) — 동시 ACTIVE 1개 보장 검증용. */
    Sprint findActiveByProject(@Param("projectId") Long projectId);

    /** 시작: status/기간/started_at 고정. */
    void updateStart(Sprint sprint);

    /** 완료: status=COMPLETED + completed_at. */
    void updateComplete(@Param("id") Long id, @Param("completedAt") OffsetDateTime completedAt);

    /** 정렬용 max sort_order(+1 채번). */
    Integer maxSortOrder(@Param("projectId") Long projectId);
}
