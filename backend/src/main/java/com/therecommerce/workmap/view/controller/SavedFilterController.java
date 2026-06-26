package com.therecommerce.workmap.view.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.common.security.auth.AuthUserInfo;
import com.therecommerce.workmap.view.dto.SavedFilterDtos;
import com.therecommerce.workmap.view.service.SavedFilterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** 저장 필터 API (T3-2 I, WMP-VIEW-004, CR-012). 인증 필요(🔒). 수정·삭제는 소유자만(서비스 가드). */
@RestController
@RequestMapping("/api/v1/saved-filters")
@RequiredArgsConstructor
public class SavedFilterController {

    private final SavedFilterService savedFilterService;

    @GetMapping
    public ResponseDto<List<SavedFilterDtos.Response>> list(@AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(savedFilterService.list(userId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseDto<SavedFilterDtos.Response> create(
            @Valid @RequestBody SavedFilterDtos.CreateRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(savedFilterService.create(req, userId));
    }

    @PutMapping("/{id}")
    public ResponseDto<SavedFilterDtos.Response> update(
            @PathVariable Long id,
            @Valid @RequestBody SavedFilterDtos.UpdateRequest req,
            @AuthUserInfo("userId") Long userId) {
        return ResponseDto.success(savedFilterService.update(id, req, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseDto<Void> delete(@PathVariable Long id, @AuthUserInfo("userId") Long userId) {
        savedFilterService.delete(id, userId);
        return ResponseDto.success(null);
    }
}
