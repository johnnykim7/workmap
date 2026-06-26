package com.therecommerce.workmap.workitem.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.workitem.domain.ActivityLog;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.domain.WorkItemLink;
import com.therecommerce.workmap.workitem.dto.LinkDtos;
import com.therecommerce.workmap.workitem.mapper.ActivityLogMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemLinkMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 이슈 링크 서비스(WMP-WI-013, BIZ-109). 링크는 양방향 자동 — source→target 정방향과 짝(INVERSE)
 * 역방향을 같은 트랜잭션에서 함께 저장하고, 삭제도 양방향 1쌍을 함께 제거한다.
 *
 * <p>가드: 자기참조 금지(7790), 유형 화이트리스트(7792, BLOCKS/BLOCKED_BY/RELATES_TO/DUPLICATES),
 * 양쪽 항목 존재 확인. 중복 링크는 매퍼의 ON CONFLICT DO NOTHING으로 무시된다.
 */
@Service
@RequiredArgsConstructor
public class WorkItemLinkService {

    private final WorkItemLinkMapper linkMapper;
    private final WorkItemMapper workItemMapper;
    private final ActivityLogMapper activityLogMapper;

    @Transactional(readOnly = true)
    public List<LinkDtos.LinkView> list(Long workItemId) {
        mustExist(workItemId);
        return linkMapper.findBySource(workItemId);
    }

    @Transactional
    public List<LinkDtos.LinkView> create(Long sourceId, LinkDtos.CreateLinkRequest req, Long actorId) {
        mustExist(sourceId);
        Long targetId = req.targetId();
        if (sourceId.equals(targetId)) {
            throw new BusinessException(WmpErrorCode.LINK_SELF_REFERENCE);          // 자기참조 금지(BIZ-109)
        }
        mustExist(targetId);

        String type = req.linkType() == null ? null : req.linkType().trim().toUpperCase();
        if (!WorkItemLink.isCreatable(type)) {
            throw new BusinessException(WmpErrorCode.LINK_TYPE_INVALID);
        }
        String inverse = WorkItemLink.INVERSE.get(type);

        // 양방향 자동 생성(BIZ-109): 정방향 + 역방향(짝). 중복은 ON CONFLICT로 무시.
        linkMapper.insert(sourceId, targetId, type);
        linkMapper.insert(targetId, sourceId, inverse);

        // 활동 로그(양쪽 항목에 기록)
        activityLogMapper.insert(ActivityLog.builder()
                .workItemId(sourceId).actorId(actorId).action(ActivityLog.LINK)
                .fromValue(null).toValue(type + ":" + targetId).build());
        activityLogMapper.insert(ActivityLog.builder()
                .workItemId(targetId).actorId(actorId).action(ActivityLog.LINK)
                .fromValue(null).toValue(inverse + ":" + sourceId).build());

        return linkMapper.findBySource(sourceId);
    }

    @Transactional
    public void delete(Long sourceId, Long linkId, Long actorId) {
        mustExist(sourceId);
        WorkItemLink link = linkMapper.findById(linkId);
        if (link == null || !link.getSourceId().equals(sourceId)) {
            throw new BusinessException(WmpErrorCode.LINK_NOT_FOUND);
        }
        String inverse = WorkItemLink.INVERSE.getOrDefault(link.getLinkType(), link.getLinkType());
        // 양방향 1쌍 삭제(정방향 + 역방향)
        linkMapper.deletePair(link.getSourceId(), link.getTargetId(), link.getLinkType(), inverse);

        activityLogMapper.insert(ActivityLog.builder()
                .workItemId(sourceId).actorId(actorId).action(ActivityLog.LINK)
                .fromValue(link.getLinkType() + ":" + link.getTargetId()).toValue(null).build());
    }

    private WorkItem mustExist(Long workItemId) {
        WorkItem w = workItemMapper.findById(workItemId);
        if (w == null) {
            throw new BusinessException(WmpErrorCode.WORK_ITEM_NOT_FOUND);
        }
        return w;
    }
}
