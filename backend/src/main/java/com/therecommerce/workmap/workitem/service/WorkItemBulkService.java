package com.therecommerce.workmap.workitem.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * 벌크 편집 오케스트레이터(WMP-WI-015). 전체를 하나의 트랜잭션으로 묶지 않고(BLK-2),
 * 각 항목을 {@link WorkItemBulkProcessor#applyOne}(REQUIRES_NEW)로 독립 처리한 뒤
 * 성공/실패를 분리 보고한다. 실패 항목은 id+사유만 담고 계속 진행한다(부분 성공 허용).
 */
@Service
@RequiredArgsConstructor
public class WorkItemBulkService {

    private final WorkItemBulkProcessor processor;

    public WorkItemDtos.BulkResult bulkUpdate(WorkItemDtos.BulkRequest req, Long actorId) {
        List<Long> succeeded = new ArrayList<>();
        List<WorkItemDtos.BulkFailure> failed = new ArrayList<>();

        for (Long id : req.ids()) {
            try {
                processor.applyOne(id, req, actorId);
                succeeded.add(id);
            } catch (BusinessException e) {
                failed.add(new WorkItemDtos.BulkFailure(id, e.getMessage()));
            } catch (RuntimeException e) {
                failed.add(new WorkItemDtos.BulkFailure(id, "처리 실패: " + e.getMessage()));
            }
        }
        return new WorkItemDtos.BulkResult(succeeded, failed);
    }
}
