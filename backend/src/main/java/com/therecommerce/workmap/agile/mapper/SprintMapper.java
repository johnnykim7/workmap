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

    /** 프로젝트의 ACTIVE 스프린트(없으면 null) — 단수 조회(레거시·번다운 등). */
    Sprint findActiveByProject(@Param("projectId") Long projectId);

    /** 프로젝트의 ACTIVE 스프린트 목록(id 오름차순) — 병렬 스프린트 보드 그룹용(CR-039). */
    List<Sprint> findAllActiveByProject(@Param("projectId") Long projectId);

    /** 전 프로젝트의 ACTIVE 스프린트 목록 — 번다운 일별 스냅샷 배치용(CR-012). */
    List<Sprint> findAllActive();

    /** 시작: status/기간/started_at 고정. */
    void updateStart(Sprint sprint);

    /** 완료: status=COMPLETED + completed_at. */
    void updateComplete(@Param("id") Long id, @Param("completedAt") OffsetDateTime completedAt);

    /** 정렬용 max sort_order(+1 채번). */
    Integer maxSortOrder(@Param("projectId") Long projectId);

    /** 편집(CR-038): name/goal/기간 수정. status 무변경. */
    void updateEdit(Sprint sprint);

    /** 삭제(CR-038): FUTURE 스프린트 하드 삭제. */
    void deleteById(@Param("id") Long id);
}
