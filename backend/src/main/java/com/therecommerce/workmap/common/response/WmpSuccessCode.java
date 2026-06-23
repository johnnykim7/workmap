package com.therecommerce.workmap.common.response;

import com.therecommerce.common.response.SuccessCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * WorkMap 도메인 성공 코드. 공통 성공 코드(CommonSuccessCode)로 부족한 도메인 응답에만 추가.
 */
@Getter
@AllArgsConstructor
public enum WmpSuccessCode implements SuccessCode {

    WORK_ITEM_CREATED("WMP-S-7710", "업무 항목이 생성되었습니다."),
    STATUS_CHANGED("WMP-S-7711", "상태가 변경되었습니다."),
    PROJECT_CREATED("WMP-S-7720", "프로젝트가 생성되었습니다."),
    SPRINT_STARTED("WMP-S-7730", "스프린트가 시작되었습니다."),
    SPRINT_COMPLETED("WMP-S-7731", "스프린트가 완료되었습니다.");

    private final String code;
    private final String message;
}
