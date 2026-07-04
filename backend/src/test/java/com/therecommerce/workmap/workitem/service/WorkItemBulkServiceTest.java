package com.therecommerce.workmap.workitem.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * 벌크 편집 단위테스트 (T3-5 Sprint 4: BLK-1/2). 항목별 독립 처리 → 성공/실패 분리 보고.
 */
@ExtendWith(MockitoExtension.class)
class WorkItemBulkServiceTest {

    @Mock WorkItemBulkProcessor processor;

    WorkItemBulkService service;

    @BeforeEach
    void setUp() {
        service = new WorkItemBulkService(processor);
    }

    private WorkItemDtos.BulkRequest req(List<Long> ids) {
        return new WorkItemDtos.BulkRequest(ids, 2L, null, null, null, null, null, null);
    }

    @Test
    @DisplayName("BLK-1: 다건 상태 일괄 변경 — 각 항목에 대해 처리기 호출")
    void 다건상태일괄변경_각항목처리() {
        service.bulkUpdate(req(List.of(1L, 2L, 3L)), 99L);

        verify(processor).applyOne(eq(1L), any(), eq(99L));
        verify(processor).applyOne(eq(2L), any(), eq(99L));
        verify(processor).applyOne(eq(3L), any(), eq(99L));
    }

    @Test
    @DisplayName("BLK-2: 일부 전이 실패 시 성공 항목 적용, 실패 항목 분리 보고(전체 롤백 아님)")
    void 일부전이실패_실패항목분리보고() {
        // id=2 는 FSM 위반으로 실패, 나머지는 성공
        doNothing().when(processor).applyOne(eq(1L), any(), anyLong());
        doThrow(new BusinessException(WmpErrorCode.TRANSITION_NOT_ALLOWED))
                .when(processor).applyOne(eq(2L), any(), anyLong());
        doNothing().when(processor).applyOne(eq(3L), any(), anyLong());

        WorkItemDtos.BulkResult res = service.bulkUpdate(req(List.of(1L, 2L, 3L)), 99L);

        assertThat(res.succeeded()).containsExactly(1L, 3L);
        assertThat(res.failed()).hasSize(1);
        assertThat(res.failed().get(0).id()).isEqualTo(2L);
        assertThat(res.failed().get(0).reason()).contains("허용되지 않은");
    }
}
