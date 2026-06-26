package com.therecommerce.workmap.user.controller;

import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.workmap.user.dto.CreateUserRequest;
import com.therecommerce.workmap.user.dto.UpdateUserRequest;
import com.therecommerce.workmap.user.dto.UserResponse;
import com.therecommerce.workmap.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자 API (T3-2 B). 생성/수정/비활성화는 Admin 전용(POL-004).
 * 로직은 UserService에만, 컨트롤러는 위임만 한다(BE 아키텍처 규칙).
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseDto<PageResponse<UserResponse>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseDto.success(userService.search(keyword, new PageRequest(page, size)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<UserResponse> create(@Valid @RequestBody CreateUserRequest req) {
        return ResponseDto.success(userService.create(req));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<UserResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest req) {
        return ResponseDto.success(userService.update(id, req));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseDto<Void> deactivate(@PathVariable Long id) {
        userService.deactivate(id);
        return ResponseDto.success(null);
    }
}
