package com.therecommerce.workmap.common.exception;

import com.therecommerce.common.exception.CommonErrorCode;
import com.therecommerce.common.response.ResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 메서드 시큐리티(@PreAuthorize) 거부를 403으로 매핑한다.
 * bp-common-lib의 GlobalExceptionHandler는 @Order(낮은 우선순위)로 등록되어 AccessDeniedException을
 * 일반 Exception(500)으로 처리하므로, 더 높은 우선순위의 핸들러로 가로챈다.
 */
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice
public class WmpSecurityExceptionHandler {

    @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
    public ResponseEntity<ResponseDto<Void>> handleAccessDenied(RuntimeException e) {
        log.warn("AccessDenied: {}", e.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ResponseDto.error(CommonErrorCode.FORBIDDEN));
    }
}
