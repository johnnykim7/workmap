package com.therecommerce.workmap.view.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.view.domain.SavedFilter;
import com.therecommerce.workmap.view.dto.SavedFilterDtos;
import com.therecommerce.workmap.view.mapper.SavedFilterMapper;
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
 * SavedFilterService 단위테스트 (CR-012, WMP-VIEW-004). 목록(내 것+공유) / 소유자 가드.
 */
@ExtendWith(MockitoExtension.class)
class SavedFilterServiceTest {

    @Mock SavedFilterMapper savedFilterMapper;

    SavedFilterService service;

    @BeforeEach
    void setUp() {
        service = new SavedFilterService(savedFilterMapper);
    }

    @Test
    @DisplayName("목록: 내 것은 mine=true, 공유받은 것은 mine=false")
    void 목록_내것_공유구분() {
        when(savedFilterMapper.findVisible(7L)).thenReturn(List.of(
                SavedFilter.builder().id(1L).ownerId(7L).name("내 필터").query("{}").shared(false).build(),
                SavedFilter.builder().id(2L).ownerId(8L).name("공유 필터").query("{}").shared(true).build()));

        List<SavedFilterDtos.Response> res = service.list(7L);

        assertThat(res).hasSize(2);
        assertThat(res.get(0).mine()).isTrue();
        assertThat(res.get(1).mine()).isFalse();
    }

    @Test
    @DisplayName("생성: owner_id=현재 사용자로 저장")
    void 생성_소유자지정() {
        when(savedFilterMapper.findById(any())).thenReturn(
                SavedFilter.builder().id(10L).ownerId(7L).name("막힌 것").query("{\"blocked\":true}").shared(false).build());

        SavedFilterDtos.Response res = service.create(
                new SavedFilterDtos.CreateRequest("막힌 것", "{\"blocked\":true}", false), 7L);

        assertThat(res.id()).isEqualTo(10L);
        assertThat(res.ownerId()).isEqualTo(7L);
        verify(savedFilterMapper).insert(argThat(f -> f.getOwnerId().equals(7L) && f.getName().equals("막힌 것")));
    }

    @Test
    @DisplayName("수정: 소유자가 아니면 SAVED_FILTER_FORBIDDEN")
    void 수정_타인_거부() {
        when(savedFilterMapper.findById(10L)).thenReturn(
                SavedFilter.builder().id(10L).ownerId(8L).name("x").query("{}").shared(false).build());

        assertThatThrownBy(() -> service.update(10L,
                new SavedFilterDtos.UpdateRequest("바꿈", "{}", true), 7L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", WmpErrorCode.SAVED_FILTER_FORBIDDEN);
        verify(savedFilterMapper, never()).update(any());
    }

    @Test
    @DisplayName("수정: 없는 필터는 SAVED_FILTER_NOT_FOUND")
    void 수정_없음_NOT_FOUND() {
        when(savedFilterMapper.findById(99L)).thenReturn(null);

        assertThatThrownBy(() -> service.update(99L,
                new SavedFilterDtos.UpdateRequest("x", "{}", false), 7L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", WmpErrorCode.SAVED_FILTER_NOT_FOUND);
    }

    @Test
    @DisplayName("삭제: 소유자면 삭제 수행")
    void 삭제_소유자_성공() {
        when(savedFilterMapper.findById(10L)).thenReturn(
                SavedFilter.builder().id(10L).ownerId(7L).name("x").query("{}").shared(false).build());

        service.delete(10L, 7L);

        verify(savedFilterMapper).delete(10L);
    }

    @Test
    @DisplayName("삭제: 소유자가 아니면 거부하고 delete 미호출")
    void 삭제_타인_거부() {
        when(savedFilterMapper.findById(10L)).thenReturn(
                SavedFilter.builder().id(10L).ownerId(8L).name("x").query("{}").shared(false).build());

        assertThatThrownBy(() -> service.delete(10L, 7L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", WmpErrorCode.SAVED_FILTER_FORBIDDEN);
        verify(savedFilterMapper, never()).delete(any());
    }
}
