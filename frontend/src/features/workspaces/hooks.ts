import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { workspaceApi, type WorkspaceRequest } from './api';
import { ApiError } from '@/lib/api-client';
import { PROJECT_TEMPLATES } from '@/types/domain';

export function useWorkspaces() {
  return useQuery({ queryKey: ['workspaces'], queryFn: workspaceApi.list, staleTime: 5 * 60_000 });
}

/** 워크스페이스 생성(WMP-WS-001) — Admin/Owner 전용. 성공 시 목록 무효화. */
export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: WorkspaceRequest) => workspaceApi.create(body),
    onSuccess: (ws) => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success(`워크스페이스 "${ws.name}"가 생성되었습니다.`);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : '워크스페이스 생성에 실패했습니다.'),
  });
}

/** 워크스페이스 수정(WMP-WS-001) — Admin/Owner 전용. */
export function useUpdateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: WorkspaceRequest }) =>
      workspaceApi.update(id, body),
    onSuccess: (ws) => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success(`워크스페이스 "${ws.name}"가 수정되었습니다.`);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : '워크스페이스 수정에 실패했습니다.'),
  });
}

/** 프로젝트 템플릿 — BE 엔드포인트 없음. FE 상수(시드 미러). 마법사 1단계 소비용. */
export function useProjectTemplates() {
  return PROJECT_TEMPLATES;
}
