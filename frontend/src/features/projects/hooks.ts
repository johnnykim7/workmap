// 프로젝트 훅 — 목록(필터)·키로 조회·요약·생성.
// BE는 by-key 엔드포인트가 없어, 라우트의 :key는 목록에서 매칭해 numeric id로 해소한다.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import {
  projectApi, type CreateProjectRequest, type ProjectFilter, type UpdateProjectRequest,
} from './api';
import { ApiError } from '@/lib/api-client';
import type { Project, Visibility } from '@/types/domain';

// 클라이언트 측 keyword 필터(BE 미지원). 이름·키 부분일치.
function applyKeyword(list: Project[], keyword?: string): Project[] {
  const k = keyword?.trim().toLowerCase();
  if (!k) return list;
  return list.filter((p) => p.name.toLowerCase().includes(k) || p.key.toLowerCase().includes(k));
}

export function useProjects(filter: ProjectFilter) {
  return useQuery({
    queryKey: ['projects', filter],
    queryFn: () => projectApi.list(filter),
    select: (list) => applyKeyword(list, filter.keyword),
  });
}

/** 전체 목록에서 key로 프로젝트 1건 해소(BE에 by-key 없음). */
export function useProjectByKey(key: string) {
  return useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => projectApi.list({}),
    enabled: !!key,
    select: (list) => list.find((p) => p.key === key),
  });
}

export function useProjectSummary(projectId?: number) {
  return useQuery({
    queryKey: ['project', projectId, 'summary'],
    queryFn: () => projectApi.summary(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectRequest) => projectApi.create(body),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`프로젝트 "${project.name}"가 생성되었습니다.`);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : '프로젝트 생성에 실패했습니다.');
    },
  });
}

// 수정/보관/가시성 공통 — 모든 'projects' 쿼리(목록·by-key)와 해당 요약 무효화.
function useInvalidateProjects() {
  const qc = useQueryClient();
  return (id?: number) => {
    qc.invalidateQueries({ queryKey: ['projects'] });
    if (id) qc.invalidateQueries({ queryKey: ['project', id] });
  };
}

/** 프로젝트 수정(WMP-WS-004) — 이름·기간·설명·탭 조합. Manager 이상. */
export function useUpdateProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateProjectRequest }) =>
      projectApi.update(id, body),
    onSuccess: (project) => {
      invalidate(project.id);
      toast.success(`프로젝트 "${project.name}"가 수정되었습니다.`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '프로젝트 수정에 실패했습니다.'),
  });
}

/** 프로젝트 보관(WMP-WS-004) — 소프트 보관(FSM 가드 경유). Manager 이상. */
export function useArchiveProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (id: number) => projectApi.archive(id),
    onSuccess: (project) => {
      invalidate(project.id);
      toast.success(`프로젝트 "${project.name}"를 보관했습니다.`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '프로젝트 보관에 실패했습니다.'),
  });
}

// ─────────────── 탭 메뉴(Jira식, CR-020) ───────────────

/** 탭 메뉴 데이터(폴백 적용 라벨·기본탭). */
export function useProjectTabs(projectId?: number) {
  return useQuery({
    queryKey: ['project', projectId, 'tabs'],
    queryFn: () => projectApi.tabs(projectId!),
    enabled: !!projectId,
  });
}

/** 탭 이름 바꾸기. 성공 시 tabs 쿼리 무효화. */
export function useRenameTab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, code, label }: { id: number; code: string; label: string }) =>
      projectApi.renameTab(id, code, label),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['project', id, 'tabs'] });
      toast.success('탭 이름을 변경했습니다.');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '탭 이름 변경에 실패했습니다.'),
  });
}

/** 탭 이름 되돌리기(기본값 폴백). */
export function useResetTabLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, code }: { id: number; code: string }) =>
      projectApi.resetTabLabel(id, code),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['project', id, 'tabs'] });
      toast.success('탭 이름을 기본값으로 되돌렸습니다.');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '되돌리기에 실패했습니다.'),
  });
}

/** 프로젝트 가시성 변경(WMP-WS-006) — PUBLIC/PRIVATE. Manager 이상. */
export function useChangeProjectVisibility() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: ({ id, visibility }: { id: number; visibility: Visibility }) =>
      projectApi.changeVisibility(id, visibility),
    onSuccess: (project) => {
      invalidate(project.id);
      toast.success(
        project.visibility === 'PRIVATE'
          ? '비공개로 변경했습니다.'
          : '공개로 변경했습니다.',
      );
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '가시성 변경에 실패했습니다.'),
  });
}
