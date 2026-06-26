package com.therecommerce.workmap.workitem.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * work_item_links 매퍼(BIZ-109). 양방향 자동 생성은 서비스에서 정/역방향 2행 insert로 처리.
 * Sprint 4에서는 promote-to-backlog(OPS-003)의 원본↔신규 링크에 사용. 전체 링크 API는 Phase 2(P2).
 */
@Mapper
public interface WorkItemLinkMapper {

    void insert(@Param("sourceId") Long sourceId,
                @Param("targetId") Long targetId,
                @Param("linkType") String linkType);
}
