package com.therecommerce.workmap.user.domain;

/**
 * 전역/프로젝트 역할 (POL-004). DB에는 String code로 저장.
 * OWNER 전체관리 / ADMIN 사용자·마스터관리 / MANAGER 프로젝트관리 / MEMBER 업무생성·수정 / VIEWER 읽기전용.
 */
public enum UserRole {
    OWNER,
    ADMIN,
    MANAGER,
    MEMBER,
    VIEWER
}
