// 사용자 초대 훅 (WMP-AUTH-004, CR-027) — 목록/초대/재발송/취소. 토스트 + 캐시 무효화.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { ApiError } from '@/lib/api-client';
import { invitationApi, type InviteRequest } from './api';

const msg = (e: unknown, fb: string) => (e instanceof ApiError ? e.message : fb);

export function useInvitations(status?: string) {
  return useQuery({
    queryKey: ['invitations', status ?? 'all'],
    queryFn: () => invitationApi.list(status),
  });
}

export function useInvitationMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['invitations'] });

  const invite = useMutation({
    mutationFn: (body: InviteRequest) => invitationApi.invite(body),
    onSuccess: () => { invalidate(); toast.success('초대 이메일(인증번호)을 발송했습니다.'); },
    onError: (e) => toast.error(msg(e, '초대에 실패했습니다.')),
  });
  const resend = useMutation({
    mutationFn: (id: number) => invitationApi.resend(id),
    onSuccess: () => { invalidate(); toast.success('인증번호를 다시 발송했습니다.'); },
    onError: (e) => toast.error(msg(e, '재발송에 실패했습니다.')),
  });
  const revoke = useMutation({
    mutationFn: (id: number) => invitationApi.revoke(id),
    onSuccess: () => { invalidate(); toast.success('초대를 취소했습니다.'); },
    onError: (e) => toast.error(msg(e, '취소에 실패했습니다.')),
  });
  return { invite, resend, revoke };
}
