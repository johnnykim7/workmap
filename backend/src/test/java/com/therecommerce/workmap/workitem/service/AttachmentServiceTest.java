package com.therecommerce.workmap.workitem.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.file.FileStorageService;
import com.therecommerce.workmap.workitem.domain.Attachment;
import com.therecommerce.workmap.workitem.mapper.AttachmentMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * AttachmentService 삭제 단위테스트 (WMP-WI-012, CR-037): 메타+디스크 삭제, 소속/존재 가드.
 */
@ExtendWith(MockitoExtension.class)
class AttachmentServiceTest {

    @Mock AttachmentMapper attachmentMapper;
    @Mock WorkItemMapper workItemMapper;
    @Mock FileStorageService fileStorageService;
    AttachmentService service;

    @BeforeEach
    void setUp() {
        service = new AttachmentService(attachmentMapper, workItemMapper, fileStorageService);
    }

    @Test
    @DisplayName("첨부삭제_정상_메타삭제및디스크파일삭제")
    void delete_valid_removesMetaAndFile() {
        Attachment a = Attachment.builder()
                .id(5L).workItemId(10L).filePath("/api/v1/files/serve/abc.png").build();
        when(attachmentMapper.findById(5L)).thenReturn(a);

        service.delete(10L, 5L, 99L);

        verify(attachmentMapper).deleteById(5L);
        verify(fileStorageService).deleteByPath("/api/v1/files/serve/abc.png");
    }

    @Test
    @DisplayName("첨부삭제_없는첨부_거부됨")
    void delete_notFound_throws() {
        when(attachmentMapper.findById(5L)).thenReturn(null);

        assertThatThrownBy(() -> service.delete(10L, 5L, 99L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", WmpErrorCode.ATTACHMENT_NOT_FOUND);
        verify(attachmentMapper, never()).deleteById(anyLong());
        verify(fileStorageService, never()).deleteByPath(anyString());
    }

    @Test
    @DisplayName("첨부삭제_다른업무소속_거부됨")
    void delete_wrongWorkItem_throws() {
        Attachment a = Attachment.builder()
                .id(5L).workItemId(77L).filePath("/api/v1/files/serve/abc.png").build();
        when(attachmentMapper.findById(5L)).thenReturn(a);

        assertThatThrownBy(() -> service.delete(10L, 5L, 99L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", WmpErrorCode.ATTACHMENT_NOT_FOUND);
        verify(attachmentMapper, never()).deleteById(anyLong());
    }
}
