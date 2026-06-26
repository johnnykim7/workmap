package com.therecommerce.workmap.ops.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.ops.domain.FieldVerification;
import com.therecommerce.workmap.ops.dto.VerificationDtos;
import com.therecommerce.workmap.ops.mapper.FieldVerificationMapper;
import com.therecommerce.workmap.workitem.domain.WorkItem;
import com.therecommerce.workmap.workitem.dto.WorkItemDtos;
import com.therecommerce.workmap.workitem.mapper.WorkItemLinkMapper;
import com.therecommerce.workmap.workitem.service.WorkItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.stubbing.Answer;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * VerificationService 단위테스트 (CR-012, WMP-OPS-004). 기록 저장 + 발견이슈 후속업무 생성.
 */
@ExtendWith(MockitoExtension.class)
class VerificationServiceTest {

    @Mock FieldVerificationMapper verificationMapper;
    @Mock WorkItemLinkMapper linkMapper;
    @Mock WorkItemService workItemService;

    VerificationService service;

    @BeforeEach
    void setUp() {
        service = new VerificationService(verificationMapper, linkMapper, workItemService);
    }

    private void stubInsertReturnsSaved() {
        // insert 시 id 부여, findById는 같은 값 반환
        doAnswer((Answer<Void>) inv -> {
            inv.getArgument(0, FieldVerification.class).setId(500L);
            return null;
        }).when(verificationMapper).insert(any());
        when(verificationMapper.findById(500L)).thenReturn(
                FieldVerification.builder().id(500L).workItemId(100L).verifier("kim")
                        .verifiedDate(LocalDate.of(2026, 6, 26)).result("FAIL").issuesFound("버튼 미동작").build());
    }

    @Test
    @DisplayName("기록 저장: createFollowUp=false면 기록만 저장(후속업무 없음)")
    void 기록저장_후속없음() {
        when(workItemService.getEntity(100L)).thenReturn(WorkItem.builder().id(100L).projectId(5L).build());
        stubInsertReturnsSaved();

        VerificationDtos.CreateResult res = service.create(100L, new VerificationDtos.CreateRequest(
                "kim", LocalDate.of(2026, 6, 26), null, null, null,
                "PASS", null, false, null, null), 99L);

        assertThat(res.verification().id()).isEqualTo(500L);
        assertThat(res.followUp()).isNull();
        verify(workItemService, never()).create(any(), anyLong());
        verify(linkMapper, never()).insert(anyLong(), anyLong(), any());
    }

    @Test
    @DisplayName("기록 저장: createFollowUp=true + 발견이슈 있으면 후속 BUG 생성 + 양방향 RELATES_TO 링크")
    void 기록저장_발견이슈_후속업무생성() {
        WorkItem origin = WorkItem.builder().id(100L).projectId(5L).title("로그인").priority("HIGH").build();
        when(workItemService.getEntity(100L)).thenReturn(origin);
        stubInsertReturnsSaved();
        when(workItemService.create(any(), eq(99L))).thenReturn(stubResponse(200L));

        VerificationDtos.CreateResult res = service.create(100L, new VerificationDtos.CreateRequest(
                "kim", LocalDate.of(2026, 6, 26), "현장", "운영", "로그인 시도",
                "FAIL", "버튼 미동작", true, null, null), 99L);

        assertThat(res.followUp().id()).isEqualTo(200L);
        // 후속 업무는 원본 프로젝트(5)에 BUG로, 발견이슈를 본문으로
        verify(workItemService).create(argThat(r ->
                r.projectId().equals(5L) && r.issueType().equals("BUG")
                        && r.description().equals("버튼 미동작")), eq(99L));
        verify(linkMapper).insert(100L, 200L, "RELATES_TO");
        verify(linkMapper).insert(200L, 100L, "RELATES_TO");
    }

    @Test
    @DisplayName("기록 저장: createFollowUp=true여도 발견이슈가 비면 후속업무 생성 안 함")
    void 기록저장_발견이슈없음_후속없음() {
        when(workItemService.getEntity(100L)).thenReturn(WorkItem.builder().id(100L).projectId(5L).build());
        stubInsertReturnsSaved();

        VerificationDtos.CreateResult res = service.create(100L, new VerificationDtos.CreateRequest(
                "kim", LocalDate.of(2026, 6, 26), null, null, null,
                "PARTIAL", "  ", true, null, null), 99L);  // 공백=발견이슈 없음

        assertThat(res.followUp()).isNull();
        verify(workItemService, never()).create(any(), anyLong());
    }

    @Test
    @DisplayName("기록 저장: 잘못된 결과값은 FIELD_VERIFICATION_RESULT_INVALID 거부")
    void 기록저장_잘못된결과_거부() {
        when(workItemService.getEntity(100L)).thenReturn(WorkItem.builder().id(100L).projectId(5L).build());

        assertThatThrownBy(() -> service.create(100L, new VerificationDtos.CreateRequest(
                "kim", LocalDate.of(2026, 6, 26), null, null, null,
                "UNKNOWN", null, false, null, null), 99L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", WmpErrorCode.FIELD_VERIFICATION_RESULT_INVALID);
    }

    private WorkItemDtos.Response stubResponse(Long id) {
        return WorkItemDtos.Response.from(WorkItem.builder()
                .id(id).key("WMP-" + id).projectId(5L).issueType("BUG")
                .title("[현장검증] 로그인").commonStatus("TODO").priority("HIGH").build());
    }
}
