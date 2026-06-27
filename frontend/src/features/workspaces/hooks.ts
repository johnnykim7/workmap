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

// ── WS 멤버 관리 (WMP-WS-007, CR-018) ──

export function useWorkspaceMembers(workspaceId: number | undefined) {
  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceApi.members(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

/** WS 멤버 추가 — 전사 Admin 전용. */
export function useAddWorkspaceMember(workspaceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => workspaceApi.addMember(workspaceId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success('멤버가 추가되었습니다.');
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : '멤버 추가에 실패했습니다.'),
  });
}

/** WS 멤버 제거 — 전사 Admin 전용. */
export function useRemoveWorkspaceMember(workspaceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => workspaceApi.removeMember(workspaceId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success('멤버가 제거되었습니다.');
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : '멤버 제거에 실패했습니다.'),
  });
}
