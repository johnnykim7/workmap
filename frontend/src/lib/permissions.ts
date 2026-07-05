// 역할 기반 권한 헬퍼 (POL-004, CR-031) — FE는 UX용(서버가 권위·403 강제).
// 권한 매핑을 한 곳에서 관리(개별 화면에 role 비교 흩뿌리지 않기 — CLAUDE.md).
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@/types/domain';

/** 쓰기 가능 역할(VIEWER 제외). BE WmpAuthz.WRITER와 일치. */
export function canWrite(role: UserRole | null | undefined): boolean {
  return role != null && role !== 'VIEWER';
}

/** 전역 관리(사용자·워크스페이스·마스터 설정). OWNER/ADMIN. */
export function canAdmin(role: UserRole | null | undefined): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/** 프로젝트 관리(생성·수정·멤버). MANAGER 이상. */
export function canManageProject(role: UserRole | null | undefined): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER';
}

/** 현재 로그인 사용자가 쓰기 가능한가(업무 생성·수정 등). VIEWER면 false. */
export function useCanWrite(): boolean {
  return canWrite(useAuthStore((s) => s.user?.role));
}

/** 현재 로그인 사용자가 전역/WS 관리자인가(시스템 관리·WS 설정 진입). OWNER/ADMIN(CR-046, POL-014). */
export function useCanAdmin(): boolean {
  return canAdmin(useAuthStore((s) => s.user?.role));
}
