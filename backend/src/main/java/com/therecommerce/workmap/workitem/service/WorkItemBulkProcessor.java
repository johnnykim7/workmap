package com.therecommerce.workmap.workitem.service;

import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 벌크 편집 단건 처리기(WMP-WI-015). 각 항목을 독립 트랜잭션(REQUIRES_NEW)으로 적용해
 * 한 항목 실패가 다른 항목을 롤백하지 않도록 격리한다(BLK-2: 전체 롤백 아님).
 *
 * <p>별도 빈으로 분리한 이유: {@code @Transactional(REQUIRES_NEW)}는 Spring AOP 프록시 경유가
 * 필요하므로 같은 빈 내부 self-invocation으로는 새 트랜잭션이 열리지 않는다.
 * 상태 전이는 {@link WorkItemService#changeStatus}(FSM 가드)를 그대로 재사용한다(BLK-1).
 */
@Component
@RequiredArgsConstructor
public class WorkItemBulkProcessor {

    private final WorkItemService workItemService;
    private final WorkItemMapper workItemMapper;

    /** 항목 1건에 벌크 변경을 적용(독립 트랜잭션). 실패 시 이 항목만 롤백되고 예외를 던진다. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void applyOne(Long id, WorkItemDtos.BulkRequest req, Long actorId) {
        WorkItem item = workItemService.getEntity(id);  // 없으면 WORK_ITEM_NOT_FOUND

        // 상태 전이(FSM 가드 경유, BLK-1) — 화이트리스트 위반 시 BusinessException
        if (req.toStatusId() != null) {
            workItemService.changeStatus(id,
                    new WorkItemDtos.ChangeStatusRequest(req.toStatusId(), req.blockReason()), actorId);
        }
        // 담당자 일괄 변경(멤버 검증 포함)
        if (Boolean.TRUE.equals(req.changeAssignee())) {
            workItemService.changeAssignee(id,
                    new WorkItemDtos.ChangeAssigneeRequest(req.assigneeId(), null), actorId);
        }
        // 스프린트 일괄 변경(FSM 미경유)
        if (Boolean.TRUE.equals(req.changeSprint())) {
            workItemService.changeSprint(id, req.sprintId(), actorId);
        }
        // 우선순위/라벨 일괄 변경(필드 수정)
        if (req.priority() != null || req.labels() != null) {
            item = workItemService.getEntity(id);
            if (req.priority() != null) item.setPriority(req.priority());
            if (req.labels() != null) item.setLabels(req.labels());
            workItemMapper.updateFields(item);
        }
    }
}
