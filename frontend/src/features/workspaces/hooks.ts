import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from './api';
import { PROJECT_TEMPLATES } from '@/types/domain';

export function useWorkspaces() {
  return useQuery({ queryKey: ['workspaces'], queryFn: workspaceApi.list, staleTime: 5 * 60_000 });
}

/** 프로젝트 템플릿 — BE 엔드포인트 없음. FE 상수(시드 미러). 마법사 1단계 소비용. */
export function useProjectTemplates() {
  return PROJECT_TEMPLATES;
}
