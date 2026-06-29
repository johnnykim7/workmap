// MSW 목 시드 — 실 BE 계약(ProjectDtos.Response / MemberDtos.Response / UserResponse)을 미러.
// dev에서 BE 미기동 시에도 화면 동작 확인용. BE 기동 시: main.tsx enableMocking + mocks/ 제거.
import type { Project, UserRole, Workspace } from '@/types/domain';

export interface SeedUser {
  id: number;
  name: string;
  email: string;
  password: string; // 목 전용 평문
  role: UserRole;
  departmentId?: number;
  active: boolean;
}

export interface ProjectMemberRow {
  projectId: number;
  userId: number;
  role: UserRole;
}

export const seedUsers: SeedUser[] = [
  { id: 1, name: '김관리', email: 'admin@workmap.com', password: 'admin1234', role: 'ADMIN', departmentId: 1, active: true },
  { id: 2, name: '이매니저', email: 'manager@workmap.com', password: 'manager1234', role: 'MANAGER', departmentId: 1, active: true },
  { id: 3, name: '박개발', email: 'dev@workmap.com', password: 'dev1234', role: 'MEMBER', departmentId: 1, active: true },
  { id: 4, name: '최운영', email: 'ops@workmap.com', password: 'ops1234', role: 'MEMBER', departmentId: 2, active: true },
  { id: 5, name: '정뷰어', email: 'viewer@workmap.com', password: 'viewer1234', role: 'VIEWER', departmentId: 2, active: true },
];

export const seedWorkspaces: Workspace[] = [
  { id: 1, name: 'therecommerce 본사' },
  { id: 2, name: '물류 플랫폼' },
];

// 실 BE ProjectDtos.Response 형태. templateId: DEV=1/OPS=2/PLAN=3(V2 시드 순서).
export const seedProjects: Project[] = [
  { id: 1, key: 'WMS', workspaceId: 2, name: 'WMS 1.0 구축', templateId: 1, status: 'ACTIVE', visibility: 'PUBLIC', workflowId: 1, activeTabs: ['summary', 'backlog', 'board'], createdBy: 2 },
  { id: 2, key: 'RGS', workspaceId: 2, name: '반품 운영 안정화', templateId: 2, status: 'ACTIVE', visibility: 'PUBLIC', workflowId: 2, activeTabs: ['summary', 'board', 'list'], createdBy: 4 },
  { id: 3, key: 'PLN', workspaceId: 1, name: '2026 H2 로드맵', templateId: 3, status: 'PLANNING', visibility: 'PRIVATE', workflowId: 3, activeTabs: ['summary', 'timeline'], createdBy: 2 },
];

export const seedMembers: ProjectMemberRow[] = [
  { projectId: 1, userId: 2, role: 'MANAGER' },
  { projectId: 1, userId: 3, role: 'MEMBER' },
  { projectId: 2, userId: 4, role: 'MANAGER' },
  { projectId: 2, userId: 5, role: 'VIEWER' },
  { projectId: 3, userId: 2, role: 'MANAGER' },
];
