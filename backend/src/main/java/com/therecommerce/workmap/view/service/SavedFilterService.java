package com.therecommerce.workmap.view.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.view.domain.SavedFilter;
import com.therecommerce.workmap.view.dto.SavedFilterDtos;
import com.therecommerce.workmap.view.mapper.SavedFilterMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 저장 필터 서비스(WMP-VIEW-004, CR-012).
 *
 * <ul>
 *   <li>목록: 내 것(owner) + 공유된 것(is_shared).</li>
 *   <li>수정·삭제: 소유자만(owner_id 불일치 시 SAVED_FILTER_FORBIDDEN).</li>
 * </ul>
 *
 * <p>Phase 1 기본/전문/퀵필터(WMP-VIEW-001·004)는 /work-items에서 이미 제공 — 본 서비스는 저장/공유만.
 */
@Service
@RequiredArgsConstructor
public class SavedFilterService {

    private final SavedFilterMapper savedFilterMapper;

    @Transactional(readOnly = true)
    public List<SavedFilterDtos.Response> list(Long viewerId) {
        return savedFilterMapper.findVisible(viewerId).stream()
                .map(f -> SavedFilterDtos.Response.from(f, viewerId)).toList();
    }

    @Transactional
    public SavedFilterDtos.Response create(SavedFilterDtos.CreateRequest req, Long ownerId) {
        SavedFilter f = SavedFilter.builder()
                .ownerId(ownerId)
                .name(req.name())
                .query(req.query())
                .shared(req.shared())
                .build();
        savedFilterMapper.insert(f);
        return SavedFilterDtos.Response.from(savedFilterMapper.findById(f.getId()), ownerId);
    }

    @Transactional
    public SavedFilterDtos.Response update(Long id, SavedFilterDtos.UpdateRequest req, Long actorId) {
        SavedFilter f = requireOwned(id, actorId);
        f.setName(req.name());
        f.setQuery(req.query());
        f.setShared(req.shared());
        savedFilterMapper.update(f);
        return SavedFilterDtos.Response.from(savedFilterMapper.findById(id), actorId);
    }

    @Transactional
    public void delete(Long id, Long actorId) {
        requireOwned(id, actorId);
        savedFilterMapper.delete(id);
    }

    /** 존재 + 소유자 일치 검증(수정·삭제 가드). */
    private SavedFilter requireOwned(Long id, Long actorId) {
        SavedFilter f = savedFilterMapper.findById(id);
        if (f == null) {
            throw new BusinessException(WmpErrorCode.SAVED_FILTER_NOT_FOUND);
        }
        if (!f.getOwnerId().equals(actorId)) {
            throw new BusinessException(WmpErrorCode.SAVED_FILTER_FORBIDDEN);
        }
        return f;
    }
}
