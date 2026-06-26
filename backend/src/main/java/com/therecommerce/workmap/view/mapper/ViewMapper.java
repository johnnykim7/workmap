package com.therecommerce.workmap.view.mapper;

import com.therecommerce.workmap.view.dto.ViewDtos;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

/**
 * 보기(타임라인/캘린더) 매퍼 (T3-2 I). work_item 단일 테이블의 파생 뷰(BIZ-106) —
 * 별도 테이블 없이 일정 컬럼(start_date/due_date)으로 조회한다. 삭제 항목 제외(BIZ-009).
 */
@Mapper
public interface ViewMapper {

    /** 타임라인(WMP-VIEW-002): 시작일 또는 기한이 있는 항목(막대). */
    List<ViewDtos.TimelineItem> timeline(@Param("projectId") Long projectId);

    /** 캘린더(WMP-VIEW-003): 기한(due_date)이 지정 월 범위에 드는 항목. */
    List<ViewDtos.TimelineItem> calendar(@Param("projectId") Long projectId,
                                         @Param("from") LocalDate from,
                                         @Param("to") LocalDate to);
}
