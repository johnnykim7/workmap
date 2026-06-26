// 멤버 훅 — 목록·초대·제거·사용자 검색. 경로는 numeric projectId.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { memberApi, type InviteMemberRequest } from './api';
import { ApiError } from '@/lib/api-client';

export function useMembers(projectId?: number) {
  return useQuery({
    queryKey: ['project', projectId, 'members'],
    queryFn: () => memberApi.list(projectId!),
    enabled: !!projectId,
  });
}

export function useUserSearch(keyword: string) {
  return useQuery({
    queryKey: ['users', 'search', keyword],
    queryFn: () => memberApi.searchUsers(keyword),
    select: (res) => res.items,
    staleTime: 60_000,
  });
}

export function useInviteMember(projectId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InviteMemberRequest) => memberApi.invite(projectId!, body),
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: ['project', projectId, 'members'] });
      toast.success(`${m.name}님을 초대했습니다.`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '멤버 초대에 실패했습니다.'),
  });
}

export function useRemoveMember(projectId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => memberApi.remove(projectId!, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId, 'members'] });
      toast.success('멤버를 제거했습니다.');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '멤버 제거에 실패했습니다.'),
  });
}
