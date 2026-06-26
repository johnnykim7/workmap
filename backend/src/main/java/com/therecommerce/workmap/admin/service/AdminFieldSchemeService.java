package com.therecommerce.workmap.admin.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.workmap.admin.domain.FieldScheme;
import com.therecommerce.workmap.admin.dto.AdminDtos;
import com.therecommerce.workmap.admin.mapper.FieldSchemeMapper;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 필드 스킴 CRUD (WMP-ADM-002, POL-006). 유형/프로젝트별 필드 표시 on/off·필수 차등(BIZ-102).
 */
@Service
@RequiredArgsConstructor
public class AdminFieldSchemeService {

    private final FieldSchemeMapper fieldSchemeMapper;

    @Transactional(readOnly = true)
    public PageResponse<AdminDtos.FieldSchemeResponse> list(Long projectId, String issueTypeCode,
                                                            PageRequest page) {
        List<AdminDtos.FieldSchemeResponse> items = fieldSchemeMapper
                .find(projectId, issueTypeCode, page.getPageSize(), page.getOffset())
                .stream().map(this::toResponse).toList();
        long total = fieldSchemeMapper.count(projectId, issueTypeCode);
        return PageResponse.of(items, total, page);
    }

    @Transactional
    public AdminDtos.FieldSchemeResponse create(AdminDtos.FieldSchemeRequest req) {
        FieldScheme scheme = FieldScheme.builder()
                .projectId(req.projectId())
                .issueTypeCode(req.issueTypeCode())
                .fieldKey(req.fieldKey())
                .isVisible(req.isVisible() == null || req.isVisible())
                .isRequired(req.isRequired() != null && req.isRequired())
                .sortOrder(req.sortOrder() == null ? 0 : req.sortOrder())
                .build();
        fieldSchemeMapper.insert(scheme);
        return toResponse(scheme);
    }

    @Transactional
    public AdminDtos.FieldSchemeResponse update(Long id, AdminDtos.FieldSchemeRequest req) {
        FieldScheme scheme = mustFind(id);
        scheme.setProjectId(req.projectId());
        scheme.setIssueTypeCode(req.issueTypeCode());
        scheme.setFieldKey(req.fieldKey());
        scheme.setVisible(req.isVisible() == null || req.isVisible());
        scheme.setRequired(req.isRequired() != null && req.isRequired());
        scheme.setSortOrder(req.sortOrder() == null ? scheme.getSortOrder() : req.sortOrder());
        fieldSchemeMapper.update(scheme);
        return toResponse(scheme);
    }

    @Transactional
    public void delete(Long id) {
        mustFind(id);
        fieldSchemeMapper.delete(id);
    }

    private FieldScheme mustFind(Long id) {
        FieldScheme scheme = fieldSchemeMapper.findById(id);
        if (scheme == null) {
            throw new BusinessException(WmpErrorCode.FIELD_SCHEME_NOT_FOUND);
        }
        return scheme;
    }

    private AdminDtos.FieldSchemeResponse toResponse(FieldScheme s) {
        return new AdminDtos.FieldSchemeResponse(s.getId(), s.getProjectId(),
                s.getIssueTypeCode(), s.getFieldKey(), s.isVisible(), s.isRequired(), s.getSortOrder());
    }
}
