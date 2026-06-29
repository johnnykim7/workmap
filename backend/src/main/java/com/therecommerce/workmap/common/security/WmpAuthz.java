package com.therecommerce.workmap.common.security;

/**
 * 역할 기반 권한 SpEL 상수 (POL-004, CR-031).
 * {@code @PreAuthorize}의 인자는 컴파일 상수여야 하므로 문자열 상수로 모아 한 곳에서 관리한다.
 * (개별 컨트롤러에 SpEL을 흩뿌리지 않는다 — CLAUDE.md "권한 매핑은 공통으로 관리".)
 */
public final class WmpAuthz {

    private WmpAuthz() {
    }

    /** 전역 관리(사용자·워크스페이스·초대·마스터 설정). OWNER/ADMIN만. */
    public static final String ADMIN = "hasAnyRole('OWNER','ADMIN')";

    /** 프로젝트 관리(생성·수정·보관·멤버). MANAGER 이상. */
    public static final String MANAGER = "hasAnyRole('OWNER','ADMIN','MANAGER')";

    /**
     * 쓰기 작업(업무 생성·수정·상태전이·댓글·첨부·스프린트·승인 등). VIEWER만 제외.
     * VIEWER는 읽기 전용(POL-004) — 조회(GET)는 별도 가드 없이 허용된다.
     */
    public static final String WRITER = "hasAnyRole('OWNER','ADMIN','MANAGER','MEMBER')";
}
