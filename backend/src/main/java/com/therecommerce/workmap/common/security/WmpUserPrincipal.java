package com.therecommerce.workmap.common.security;

import com.therecommerce.common.security.BaseUserPrincipal;
import lombok.Getter;
import lombok.Setter;

/**
 * WorkMap 인증 사용자. bp-common-lib {@link BaseUserPrincipal} 확장(부서 추가).
 * 컨트롤러에서 {@code @AuthUser WmpUserPrincipal}로 주입받는다.
 */
@Getter
@Setter
public class WmpUserPrincipal extends BaseUserPrincipal {

    /** 부서 ID(departments.id). 토큰 deptId 클레임. */
    private Long departmentId;
}
