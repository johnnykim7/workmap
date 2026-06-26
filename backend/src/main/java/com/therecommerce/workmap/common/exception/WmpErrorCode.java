package com.therecommerce.workmap.common.exception;

import com.therecommerce.common.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * WorkMap 도메인 에러 코드 — 7700번대(조직 규약: 프로젝트 에러코드는 7700 이후).
 * 코드 체계: WMP-7700 ~. 새 도메인 에러는 이 enum에 추가한다.
 */
@Getter
@AllArgsConstructor
public enum WmpErrorCode implements ErrorCode {

    // 공통(77000번대)
    RESOURCE_NOT_FOUND("WMP-7700", "요청한 리소스를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    INVALID_REQUEST("WMP-7701", "잘못된 요청입니다.", HttpStatus.BAD_REQUEST),

    // 업무 항목 / FSM (7710번대)
    WORK_ITEM_NOT_FOUND("WMP-7710", "업무 항목을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    TRANSITION_NOT_ALLOWED("WMP-7711", "허용되지 않은 상태 전이입니다.", HttpStatus.CONFLICT),
    BLOCK_REASON_REQUIRED("WMP-7712", "차단 사유는 필수입니다.", HttpStatus.BAD_REQUEST),
    PROJECT_REQUIRED("WMP-7713", "업무 항목에는 프로젝트가 필수입니다.", HttpStatus.BAD_REQUEST),
    HIERARCHY_VIOLATION("WMP-7714", "계층 정합성에 위배됩니다.", HttpStatus.BAD_REQUEST),

    // 프로젝트 / 워크스페이스 (7720번대)
    PROJECT_NOT_FOUND("WMP-7720", "프로젝트를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    PROJECT_KEY_DUPLICATED("WMP-7721", "이미 사용 중인 프로젝트 키입니다.", HttpStatus.CONFLICT),
    WORKSPACE_NOT_FOUND("WMP-7722", "워크스페이스를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    NOT_PROJECT_MEMBER("WMP-7723", "프로젝트 멤버만 접근할 수 있습니다.", HttpStatus.FORBIDDEN),

    // 스프린트 (7730번대)
    SPRINT_NOT_FOUND("WMP-7730", "스프린트를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    ACTIVE_SPRINT_EXISTS("WMP-7731", "이미 진행 중인 스프린트가 있습니다.", HttpStatus.CONFLICT),
    SPRINT_NOT_FUTURE("WMP-7732", "예정(FUTURE) 상태의 스프린트만 시작할 수 있습니다.", HttpStatus.CONFLICT),
    SPRINT_NOT_ACTIVE("WMP-7733", "진행 중(ACTIVE) 상태의 스프린트만 완료할 수 있습니다.", HttpStatus.CONFLICT),

    // 인증 / 사용자 (7740번대)
    USER_NOT_FOUND("WMP-7740", "사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    EMAIL_DUPLICATED("WMP-7741", "이미 가입된 이메일입니다.", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS("WMP-7742", "이메일 또는 비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED),

    // 승인 (7750번대)
    APPROVAL_NOT_FOUND("WMP-7750", "승인 요청을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    NOT_AUTHORIZED_APPROVER("WMP-7751", "지정된 승인자만 처리할 수 있습니다.", HttpStatus.FORBIDDEN),
    APPROVAL_PENDING("WMP-7752", "승인 대기 중입니다. 승인 완료 후 다음 상태로 전이할 수 있습니다.", HttpStatus.CONFLICT),
    APPROVAL_ALREADY_DECIDED("WMP-7753", "이미 처리된 승인 요청입니다.", HttpStatus.CONFLICT);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
}
