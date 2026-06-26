package com.therecommerce.workmap.burndown.mapper;

import com.therecommerce.workmap.burndown.domain.BurndownSnapshot;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 번다운 스냅샷 매퍼(CR-012). 적재는 upsert(멱등), 조회는 스프린트별 시계열.
 */
@Mapper
public interface BurndownMapper {

    /** 같은 일자 재적재는 갱신(UNIQUE sprint_id+snapshot_date). */
    void upsert(BurndownSnapshot snapshot);

    /** 스프린트 번다운 시계열(snapshot_date ASC). */
    List<BurndownSnapshot> findBySprint(@Param("sprintId") Long sprintId);

    /** 벨로시티용: 프로젝트의 완료 스프린트별 COMPLETE 스냅샷(완료포인트). */
    List<BurndownSnapshot> findCompletedByProject(@Param("projectId") Long projectId);
}
