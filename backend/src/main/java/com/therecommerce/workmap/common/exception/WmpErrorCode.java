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
    APPROVAL_ALREADY_DECIDED("WMP-7753", "이미 처리된 승인 요청입니다.", HttpStatus.CONFLICT),

    // 알림 (7760번대, WMP-NOTI-001)
    NOTIFICATION_NOT_FOUND("WMP-7760", "알림을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    NOTIFICATION_FORBIDDEN("WMP-7761", "본인에게 온 알림만 처리할 수 있습니다.", HttpStatus.FORBIDDEN),

    // 관리자 마스터 (7770번대, WMP-ADM-001~003)
    MEASURE_UNIT_NOT_FOUND("WMP-7770", "측정 단위를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    MEASURE_UNIT_SYSTEM_PROTECTED("WMP-7771", "시스템 기본 측정 단위는 수정·삭제할 수 없습니다.", HttpStatus.CONFLICT),
    MEASURE_UNIT_IN_USE("WMP-7772", "사용 중인 측정 단위는 삭제할 수 없습니다.", HttpStatus.CONFLICT),
    FIELD_SCHEME_NOT_FOUND("WMP-7773", "필드 스킴을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    WORKFLOW_NOT_FOUND("WMP-7774", "워크플로를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    WORKFLOW_SYSTEM_PROTECTED("WMP-7775", "시스템 기본 워크플로는 수정·삭제할 수 없습니다.", HttpStatus.CONFLICT),
    WORKFLOW_IN_USE("WMP-7776", "프로젝트가 사용 중인 워크플로는 삭제할 수 없습니다.", HttpStatus.CONFLICT),
    WORKFLOW_STATUS_NOT_FOUND("WMP-7777", "워크플로 상태를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    WORKFLOW_STATUS_IN_USE("WMP-7778", "업무 항목이 사용 중인 상태는 삭제할 수 없습니다.", HttpStatus.CONFLICT),
    WORKFLOW_TRANSITION_NOT_FOUND("WMP-7779", "워크플로 전이를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    WORKFLOW_TRANSITION_DUPLICATED("WMP-7780", "이미 존재하는 전이입니다.", HttpStatus.CONFLICT),
    WORKFLOW_STATUS_MISMATCH("WMP-7781", "전이의 상태가 해당 워크플로에 속하지 않습니다.", HttpStatus.BAD_REQUEST),

    // 링크 (7790번대, WMP-WI-013, BIZ-109)
    LINK_SELF_REFERENCE("WMP-7790", "자기 자신과는 링크할 수 없습니다.", HttpStatus.BAD_REQUEST),
    LINK_NOT_FOUND("WMP-7791", "링크를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    LINK_TYPE_INVALID("WMP-7792", "지원하지 않는 링크 유형입니다.", HttpStatus.BAD_REQUEST),

    // 업무 유형 마스터 (7793~, WMP-ADM-004)
    ISSUE_TYPE_NOT_FOUND("WMP-7793", "업무 유형을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    ISSUE_TYPE_SYSTEM_PROTECTED("WMP-7794", "시스템 기본 업무 유형은 수정·삭제할 수 없습니다.", HttpStatus.CONFLICT),
    ISSUE_TYPE_IN_USE("WMP-7795", "사용 중인 업무 유형은 삭제할 수 없습니다.", HttpStatus.CONFLICT),
    ISSUE_TYPE_CODE_DUPLICATED("WMP-7796", "이미 사용 중인 업무 유형 코드입니다.", HttpStatus.CONFLICT),

    // 양식 빌더 (7797~, WMP-ADM-005)
    FORM_NOT_FOUND("WMP-7797", "양식을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // Phase 2 잔여 3종 (7798~, CR-012)
    SPRINT_NOT_STARTED("WMP-7798", "아직 시작되지 않은 스프린트의 번다운은 조회할 수 없습니다.", HttpStatus.BAD_REQUEST),
    FIELD_VERIFICATION_NOT_FOUND("WMP-7799", "현장검증 기록을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    FIELD_VERIFICATION_RESULT_INVALID("WMP-7800", "검증 결과는 PASS/FAIL/PARTIAL 중 하나여야 합니다.", HttpStatus.BAD_REQUEST),
    SAVED_FILTER_NOT_FOUND("WMP-7801", "저장 필터를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    SAVED_FILTER_FORBIDDEN("WMP-7802", "본인이 만든 저장 필터만 수정·삭제할 수 있습니다.", HttpStatus.FORBIDDEN),

    // 워크스페이스 멤버십 격리 (7803~, WMP-WS-007/008, BIZ-112, CR-018)
    WORKSPACE_ACCESS_DENIED("WMP-7803", "이 워크스페이스에 접근할 권한이 없습니다.", HttpStatus.FORBIDDEN),
    WORKSPACE_MEMBER_NOT_FOUND("WMP-7804", "워크스페이스 멤버를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    WORKSPACE_MEMBER_DUPLICATED("WMP-7805", "이미 워크스페이스 멤버입니다.", HttpStatus.CONFLICT),

    // 탭 메뉴(Jira식) — 라벨/기본탭 (7806~, WMP-WS-004, CR-020)
    TAB_NOT_FOUND("WMP-7806", "알 수 없는 탭 코드입니다.", HttpStatus.NOT_FOUND),
    TAB_LABEL_INVALID("WMP-7807", "탭 이름은 1~60자여야 합니다.", HttpStatus.BAD_REQUEST),
    TAB_SUMMARY_LOCKED("WMP-7808", "요약 탭은 제거·이동·기본해제할 수 없습니다.", HttpStatus.BAD_REQUEST),

    // 파일 업로드 (7809번대, CR-024 — 리치 에디터 인라인 이미지)
    FILE_EMPTY("WMP-7809", "업로드할 파일이 비어 있습니다.", HttpStatus.BAD_REQUEST),
    FILE_TYPE_NOT_ALLOWED("WMP-7810", "허용되지 않는 파일 형식입니다.", HttpStatus.BAD_REQUEST),
    FILE_SIZE_EXCEEDED("WMP-7811", "허용 용량을 초과한 파일입니다.", HttpStatus.PAYLOAD_TOO_LARGE),
    FILE_STORAGE_FAILED("WMP-7812", "파일 저장에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_NOT_FOUND("WMP-7813", "요청한 파일을 찾을 수 없습니다.", HttpStatus.NOT_FOUND);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
}
