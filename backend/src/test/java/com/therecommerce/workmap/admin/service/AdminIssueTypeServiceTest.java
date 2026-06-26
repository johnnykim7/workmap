package com.therecommerce.workmap.admin.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.admin.domain.IssueTypeMaster;
import com.therecommerce.workmap.admin.dto.AdminDtos;
import com.therecommerce.workmap.admin.mapper.IssueTypeMapper;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * AdminIssueTypeService 단위테스트 (WMP-ADM-004, BIZ-107): 생성·코드중복·depth검증·시스템보호·사용중삭제.
 */
@ExtendWith(MockitoExtension.class)
class AdminIssueTypeServiceTest {

    @Mock IssueTypeMapper issueTypeMapper;
    AdminIssueTypeService service;

    @BeforeEach
    void setUp() {
        service = new AdminIssueTypeService(issueTypeMapper);
    }

    private AdminDtos.IssueTypeRequest req(String code, int depth) {
        return new AdminDtos.IssueTypeRequest(code, "운영요청", depth, "orange", "ops", 6);
    }

    @Test
    @DisplayName("생성_신규유형_소문자코드대문자화")
    void 생성_성공() {
        when(issueTypeMapper.existsByCode("OPSREQ")).thenReturn(false);

        AdminDtos.IssueTypeResponse res = service.create(req("opsreq", 1));

        assertThat(res.code()).isEqualTo("OPSREQ");
        assertThat(res.isSystem()).isFalse();
        verify(issueTypeMapper).insert(any(IssueTypeMaster.class));
    }

    @Test
    @DisplayName("생성_코드중복_거부됨")
    void 생성_코드중복() {
        when(issueTypeMapper.existsByCode("TASK")).thenReturn(true);

        assertThatThrownBy(() -> service.create(req("TASK", 1)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.ISSUE_TYPE_CODE_DUPLICATED);
        verify(issueTypeMapper, never()).insert(any());
    }

    @Test
    @DisplayName("생성_depth범위초과_거부됨")
    void 생성_depth검증() {
        assertThatThrownBy(() -> service.create(req("X", 3)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.INVALID_REQUEST);
        verify(issueTypeMapper, never()).insert(any());
    }

    @Test
    @DisplayName("수정_시스템유형_거부됨")
    void 수정_시스템보호() {
        when(issueTypeMapper.findById(1L)).thenReturn(
                IssueTypeMaster.builder().id(1L).code("EPIC").isSystem(true).build());

        assertThatThrownBy(() -> service.update(1L, req("EPIC", 0)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.ISSUE_TYPE_SYSTEM_PROTECTED);
        verify(issueTypeMapper, never()).update(any());
    }

    @Test
    @DisplayName("삭제_사용중유형_거부됨")
    void 삭제_사용중() {
        when(issueTypeMapper.findById(7L)).thenReturn(
                IssueTypeMaster.builder().id(7L).code("OPSREQ").isSystem(false).build());
        when(issueTypeMapper.isInUse("OPSREQ")).thenReturn(true);

        assertThatThrownBy(() -> service.delete(7L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.ISSUE_TYPE_IN_USE);
        verify(issueTypeMapper, never()).delete(any());
    }

    @Test
    @DisplayName("삭제_미사용커스텀유형_성공")
    void 삭제_성공() {
        when(issueTypeMapper.findById(7L)).thenReturn(
                IssueTypeMaster.builder().id(7L).code("OPSREQ").isSystem(false).build());
        when(issueTypeMapper.isInUse("OPSREQ")).thenReturn(false);

        service.delete(7L);

        verify(issueTypeMapper).delete(7L);
    }
}
