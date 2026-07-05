package com.therecommerce.workmap.workitem.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * attachments 도메인(T3-1, WMP-WI-012). 파일 저장 자체(스토리지)는 Phase 2 — 여기선 메타만.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attachment {

    private Long id;
    private Long workItemId;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String contentType;
    private Long uploadedBy;
    private OffsetDateTime createdAt;
}
