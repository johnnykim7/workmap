// 프로젝트 훅 — 목록(필터)·키로 조회·요약·생성.
// BE는 by-key 엔드포인트가 없어, 라우트의 :key는 목록에서 매칭해 numeric id로 해소한다.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { projectApi, type CreateProjectRequest, type ProjectFilter } from './api';
import { ApiError } from '@/lib/api-client';
import type { Project } from '@/types/domain';

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
