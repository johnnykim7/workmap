package com.therecommerce.workmap.workitem.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.file.FileStorageService;
import com.therecommerce.workmap.workitem.domain.Attachment;
import com.therecommerce.workmap.workitem.dto.SubResourceDtos;
import com.therecommerce.workmap.workitem.mapper.AttachmentMapper;
import com.therecommerce.workmap.workitem.mapper.WorkItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 첨부 서비스(WMP-WI-012, CR-037). 실제 파일은 FileStorageService(로컬 디스크)가 저장,
 * 여기선 첨부 메타(attachments) 등록/조회/삭제를 담당. 삭제 시 디스크 파일도 함께 제거.
 */
@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentMapper attachmentMapper;
    private final WorkItemMapper workItemMapper;
    private final FileStorageService fileStorageService;

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

    /**
     * 첨부 삭제(CR-037). 메타(attachments 행) + 디스크 파일을 함께 제거.
     * - 없는 첨부 → ATTACHMENT_NOT_FOUND, 다른 work_item 소속 → 동일(경로 불일치=존재하지 않는 것으로 취급).
     * - 디스크 파일 삭제는 best-effort(FileStorageService가 예외를 삼킴).
     */
    @Transactional
    public void delete(Long workItemId, Long attachmentId, Long actorId) {
        Attachment attachment = attachmentMapper.findById(attachmentId);
        if (attachment == null || !attachment.getWorkItemId().equals(workItemId)) {
            throw new BusinessException(WmpErrorCode.ATTACHMENT_NOT_FOUND);
        }
        attachmentMapper.deleteById(attachmentId);
        fileStorageService.deleteByPath(attachment.getFilePath());
    }
}
