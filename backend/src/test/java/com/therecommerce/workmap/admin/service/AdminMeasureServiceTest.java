package com.therecommerce.workmap.admin.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.admin.dto.AdminDtos;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.measure.domain.MeasureUnit;
import com.therecommerce.workmap.measure.mapper.MeasureUnitMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * AdminMeasureService 단위테스트 (WMP-ADM-001, POL-005): 생성/타입검증/시스템·사용중 삭제 가드.
 */
@ExtendWith(MockitoExtension.class)
class AdminMeasureServiceTest {

    @Mock MeasureUnitMapper measureUnitMapper;
    AdminMeasureService service;

    @BeforeEach
    void setUp() {
        service = new AdminMeasureService(measureUnitMapper);
    }

    @Test
    @DisplayName("생성_NUMBER단위_저장됨")
    void 생성_성공() {
        AdminDtos.MeasureUnitRequest req =
                new AdminDtos.MeasureUnitRequest("건수", "NUMBER", "건", null, 1);

        AdminDtos.MeasureUnitResponse res = service.create(req);

        assertThat(res.name()).isEqualTo("건수");
        assertThat(res.options()).isEmpty();   // null → 빈 리스트 보정
        verify(measureUnitMapper).insert(any(MeasureUnit.class));
    }

    @Test
    @DisplayName("생성_잘못된타입_거부됨")
    void 생성_타입검증() {
        AdminDtos.MeasureUnitRequest req =
                new AdminDtos.MeasureUnitRequest("이상", "TEXT", null, null, 0);

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.INVALID_REQUEST);
        verify(measureUnitMapper, never()).insert(any());
    }

    @Test
    @DisplayName("수정_시스템단위_거부됨")
    void 수정_시스템보호() {
        when(measureUnitMapper.findById(1L)).thenReturn(
                MeasureUnit.builder().id(1L).isSystem(true).build());
        AdminDtos.MeasureUnitRequest req =
                new AdminDtos.MeasureUnitRequest("변경", "NUMBER", null, null, 0);

        assertThatThrownBy(() -> service.update(1L, req))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.MEASURE_UNIT_SYSTEM_PROTECTED);
        verify(measureUnitMapper, never()).update(any());
    }

    @Test
    @DisplayName("삭제_사용중단위_거부됨")
    void 삭제_사용중가드() {
        when(measureUnitMapper.findById(2L)).thenReturn(
                MeasureUnit.builder().id(2L).isSystem(false).build());
        when(measureUnitMapper.isInUse(2L)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(2L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.MEASURE_UNIT_IN_USE);
        verify(measureUnitMapper, never()).delete(any());
    }

    @Test
    @DisplayName("삭제_미사용일반단위_성공")
    void 삭제_성공() {
        when(measureUnitMapper.findById(3L)).thenReturn(
                MeasureUnit.builder().id(3L).isSystem(false).build());
        when(measureUnitMapper.isInUse(3L)).thenReturn(false);

        service.delete(3L);

        verify(measureUnitMapper).delete(3L);
    }

    @Test
    @DisplayName("삭제_없는단위_NOT_FOUND")
    void 삭제_없음() {
        when(measureUnitMapper.findById(404L)).thenReturn(null);

        assertThatThrownBy(() -> service.delete(404L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.MEASURE_UNIT_NOT_FOUND);
    }
}
