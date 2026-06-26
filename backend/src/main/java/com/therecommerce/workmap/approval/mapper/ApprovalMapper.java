package com.therecommerce.workmap.approval.mapper;

import com.therecommerce.workmap.approval.domain.Approval;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.OffsetDateTime;
import java.util.List;

@Mapper
public interface ApprovalMapper {

    void insert(Approval approval);

    Approval findById(@Param("id") Long id);

    /** 항목별 승인 이력(최신순). */
    List<Approval> findByWorkItem(@Param("workItemId") Long workItemId);

    /** 특정 work_item의 특정 게이트 상태에 대한 승인 행들(다수 승인 검사용). */
    List<Approval> findByWorkItemAndStatus(@Param("workItemId") Long workItemId,
                                           @Param("statusId") Long statusId);

    /** 특정 게이트 상태에 PENDING 승인이 남아있는지(BIZ-110 전이 차단). */
    int countPendingByWorkItemAndStatus(@Param("workItemId") Long workItemId,
                                        @Param("statusId") Long statusId);

    /** 프로젝트 단위 승인 목록(필터: decision). */
    List<Approval> findByProject(@Param("projectId") Long projectId,
                                 @Param("decision") String decision);

    /** 승인/거부 처리 반영. */
    void updateDecision(@Param("id") Long id,
                        @Param("decision") String decision,
                        @Param("comment") String comment,
                        @Param("decidedBy") Long decidedBy,
                        @Param("decidedAt") OffsetDateTime decidedAt);
}
