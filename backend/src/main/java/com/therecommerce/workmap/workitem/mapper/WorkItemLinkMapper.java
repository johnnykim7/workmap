package com.therecommerce.workmap.workitem.mapper;

import com.therecommerce.workmap.workitem.domain.WorkItemLink;
import com.therecommerce.workmap.workitem.dto.LinkDtos;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * work_item_links 매퍼(BIZ-109). 양방향 자동 생성은 서비스에서 정/역방향 2행 insert로 처리.
 * Sprint 4에서는 promote-to-backlog(OPS-003)의 원본↔신규 링크에 사용. 전체 링크 API는 Phase 2(P2).
 */
@Mapper
public interface WorkItemLinkMapper {

    void insert(@Param("sourceId") Long sourceId,
                @Param("targetId") Long targetId,
                @Param("linkType") String linkType);

    /** 단건 조회(소유 검증/삭제 가드용). */
    WorkItemLink findById(@Param("id") Long id);

    /** source_id 기준 링크 목록 + 연결된 target 항목 메타(연결 목록 표시용). */
    List<LinkDtos.LinkView> findBySource(@Param("sourceId") Long sourceId);

    /** 정/역 양방향 1쌍 삭제(source↔target + linkType/INVERSE). */
    void deletePair(@Param("sourceId") Long sourceId,
                    @Param("targetId") Long targetId,
                    @Param("linkType") String linkType,
                    @Param("inverseType") String inverseType);
}
