package com.therecommerce.workmap.workitem.mapper;

import com.therecommerce.workmap.workitem.domain.WorkItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * work_items 단일 테이블 매퍼(T3-1). 조회는 항상 deleted_at IS NULL(BIZ-009 소프트삭제) 기준.
 * key 채번은 projects.seq_counter UPDATE … RETURNING(동시성 안전, WI-4).
 */
@Mapper
public interface WorkItemMapper {

    void insert(WorkItem item);

    /** 삭제 제외 단건. */
    WorkItem findById(@Param("id") Long id);

    /** 소프트삭제 포함(이미 삭제된 것 재확인용). */
    WorkItem findByIdIncludingDeleted(@Param("id") Long id);

    /** key 채번: projects.seq_counter += 1 후 새 값 반환(UPDATE … RETURNING). */
    int nextSeq(@Param("projectId") Long projectId);

    /** 항목 기본 필드 수정(제목/설명/우선순위/기한/라벨/유형 고유 필드 등). */
    void updateFields(WorkItem item);

    /** 상태 전이 반영(status_id/common_status/prev_status_id/block_reason/completed_at/status_changed_at). */
    void updateStatus(WorkItem item);

    /** 담당자/보고자 변경. */
    void updateAssignee(@Param("id") Long id,
                        @Param("assigneeId") Long assigneeId,
                        @Param("reporterId") Long reporterId);

    /** 측정값/진행률 갱신(measure_unit_id/target/current/progress). */
    void updateMeasure(WorkItem item);

    /** 유형 전환(issue_type + 계층 컬럼 재설정). */
    void updateType(WorkItem item);

    /** 진행률만 갱신(상위 Epic 집계 등). */
    void updateProgress(@Param("id") Long id, @Param("progress") int progress);

    /** 스프린트 소속 변경(FSM 미경유, SPR-5). */
    void updateSprint(@Param("id") Long id, @Param("sprintId") Long sprintId);

    /** 소프트삭제(deleted_at 설정). */
    void softDelete(@Param("id") Long id, @Param("deletedAt") OffsetDateTime deletedAt);

    /** 자식(parent_id) 소프트삭제 — 부모 삭제 시 함께 처리(WI-6). */
    void softDeleteChildren(@Param("parentId") Long parentId,
                            @Param("deletedAt") OffsetDateTime deletedAt);

    List<WorkItem> findChildren(@Param("parentId") Long parentId);

    /** Epic 직속 자식(epic_id) — 진행률 집계 소스(AGG-1). */
    List<WorkItem> findByEpic(@Param("epicId") Long epicId);

    /** 순환 참조 검사(HRC-4): candidateAncestorId가 nodeId의 자손인지. */
    boolean isDescendant(@Param("nodeId") Long nodeId,
                         @Param("candidateAncestorId") Long candidateAncestorId);
}
