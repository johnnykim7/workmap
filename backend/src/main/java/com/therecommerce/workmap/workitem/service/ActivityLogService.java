package com.therecommerce.workmap.workitem.service;

import com.therecommerce.workmap.workitem.dto.SubResourceDtos;
import com.therecommerce.workmap.workitem.mapper.ActivityLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 활동/변경 이력 조회(WMP-WI-011). 기록(insert)은 WorkItemService가 동일 트랜잭션에서 직접 수행한다.
 */
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogMapper activityLogMapper;

    @Transactional(readOnly = true)
    public List<SubResourceDtos.ActivityResponse> list(Long workItemId) {
        return activityLogMapper.findByWorkItem(workItemId).stream()
                .map(SubResourceDtos.ActivityResponse::from).toList();
    }
}
