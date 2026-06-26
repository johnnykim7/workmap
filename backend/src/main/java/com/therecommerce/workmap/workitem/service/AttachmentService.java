package com.therecommerce.workmap.workitem.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.workitem.domain.Attachment;
import com.therecommerce.workmap.workitem.dto.SubResourceDtos;
import com.therecommerce.workmap.workitem.mapper.AttachmentMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 첨부 메타 서비스(WMP-WI-012). 실제 파일 스토리지 연동은 Phase 2 — 여기선 메타 등록/조회만.
 */
@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentMapper attachmentMapper;
    private final WorkItemMapper workItemMapper;

    @Transactional
    public SubResourceDtos.AttachmentResponse create(Long workItemId,
                                                     SubResourceDtos.CreateAttachmentRequest req, Long actorId) {
        if (workItemMapper.findById(workItemId) == null) {
            throw new BusinessException(WmpErrorCode.WORK_ITEM_NOT_FOUND);
        }
        Attachment attachment = Attachment.builder()
                .workItemId(workItemId)
                .fileName(req.fileName())
                .filePath(req.filePath())
                .fileSize(req.fileSize())
                .contentType(req.contentType())
                .uploadedBy(actorId)
                .build();
        attachmentMapper.insert(attachment);
        return SubResourceDtos.AttachmentResponse.from(attachment);
    }

    @Transactional(readOnly = true)
    public List<SubResourceDtos.AttachmentResponse> list(Long workItemId) {
        return attachmentMapper.findByWorkItem(workItemId).stream()
                .map(SubResourceDtos.AttachmentResponse::from).toList();
    }
}
