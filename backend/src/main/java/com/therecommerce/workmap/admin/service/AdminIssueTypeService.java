package com.therecommerce.workmap.admin.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.workmap.admin.domain.IssueTypeMaster;
import com.therecommerce.workmap.admin.dto.AdminDtos;
import com.therecommerce.workmap.admin.mapper.IssueTypeMapper;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 업무 유형 마스터 CRUD (WMP-ADM-004, BIZ-107). 유형은 하드코딩 enum이 아니라 마스터 행 —
 * 관리자가 행 추가로 새 유형을 만든다(코드 변경 0).
 *
 * <p>가드: 시스템 기본 5종(is_system=true)은 수정·삭제 불가(7794). 사용 중(work_items.issue_type
 * 참조) 유형은 삭제 불가(7795). 코드 중복 금지(7796). depth는 0~2(계층 정합성 BIZ-103 판정 범위).
 * 코드(code)는 식별자라 update에서 변경하지 않는다.
 */
@Service
@RequiredArgsConstructor
public class AdminIssueTypeService {

    private final IssueTypeMapper issueTypeMapper;

    @Transactional(readOnly = true)
    public PageResponse<AdminDtos.IssueTypeResponse> list(PageRequest page) {
        List<AdminDtos.IssueTypeResponse> items = issueTypeMapper
                .findAll(page.getPageSize(), page.getOffset())
                .stream().map(AdminDtos.IssueTypeResponse::from).toList();
        long total = issueTypeMapper.countAll();
        return PageResponse.of(items, total, page);
    }

    @Transactional
    public AdminDtos.IssueTypeResponse create(AdminDtos.IssueTypeRequest req) {
        validateDepth(req.depth());
        String code = req.code() == null ? null : req.code().trim().toUpperCase();
        if (code == null || code.isBlank()) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST, "유형 코드는 필수입니다.");
        }
        if (issueTypeMapper.existsByCode(code)) {
            throw new BusinessException(WmpErrorCode.ISSUE_TYPE_CODE_DUPLICATED);
        }
        IssueTypeMaster type = IssueTypeMaster.builder()
                .code(code)
                .label(req.label())
                .depth(req.depth())
                .color(req.color())
                .icon(req.icon())
                .isSystem(false)
                .sortOrder(req.sortOrder() == null ? 0 : req.sortOrder())
                .build();
        issueTypeMapper.insert(type);
        return AdminDtos.IssueTypeResponse.from(type);
    }

    @Transactional
    public AdminDtos.IssueTypeResponse update(Long id, AdminDtos.IssueTypeRequest req) {
        IssueTypeMaster type = mustFind(id);
        if (type.isSystem()) {
            throw new BusinessException(WmpErrorCode.ISSUE_TYPE_SYSTEM_PROTECTED);
        }
        validateDepth(req.depth());
        // 코드는 식별자 — 변경하지 않는다(라벨/색/아이콘/depth/정렬만)
        type.setLabel(req.label());
        type.setDepth(req.depth());
        type.setColor(req.color());
        type.setIcon(req.icon());
        if (req.sortOrder() != null) {
            type.setSortOrder(req.sortOrder());
        }
        issueTypeMapper.update(type);
        return AdminDtos.IssueTypeResponse.from(type);
    }

    @Transactional
    public void delete(Long id) {
        IssueTypeMaster type = mustFind(id);
        if (type.isSystem()) {
            throw new BusinessException(WmpErrorCode.ISSUE_TYPE_SYSTEM_PROTECTED);
        }
        if (issueTypeMapper.isInUse(type.getCode())) {
            throw new BusinessException(WmpErrorCode.ISSUE_TYPE_IN_USE);
        }
        issueTypeMapper.delete(id);
    }

    private IssueTypeMaster mustFind(Long id) {
        IssueTypeMaster type = issueTypeMapper.findById(id);
        if (type == null) {
            throw new BusinessException(WmpErrorCode.ISSUE_TYPE_NOT_FOUND);
        }
        return type;
    }

    private void validateDepth(int depth) {
        if (depth < 0 || depth > 2) {
            throw new BusinessException(WmpErrorCode.INVALID_REQUEST,
                    "depth는 0~2 사이여야 합니다(계층 정합성 BIZ-103).");
        }
    }
}
