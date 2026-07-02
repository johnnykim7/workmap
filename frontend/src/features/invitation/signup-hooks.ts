// 가입 요청 관리 훅 (WMP-AUTH-010, CR-032) — 목록/승인/거절. 토스트 + 캐시 무효화.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { ApiError } from '@/lib/api-client';
import { signupRequestApi } from './signup-api';

const msg = (e: unknown, fb: string) => (e instanceof ApiError ? e.message : fb);

export function useSignupRequests(status = 'PENDING') {
  return useQuery({
    queryKey: ['signup-requests', status],
    queryFn: () => signupRequestApi.list(status),
  });
}

export function useSignupRequestMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['signup-requests'] });
    qc.invalidateQueries({ queryKey: ['invitations'] }); // 승인 시 초대 생성
  };

  const approve = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => signupRequestApi.approve(id, role),
    onSuccess: () => { invalidate(); toast.success('가입을 승인하고 초대를 발송했습니다.'); },
    onError: (e) => toast.error(msg(e, '승인에 실패했습니다.')),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => signupRequestApi.reject(id, reason),
    onSuccess: () => { invalidate(); toast.success('가입 요청을 거절했습니다.'); },
    onError: (e) => toast.error(msg(e, '거절에 실패했습니다.')),
  });
  return { approve, reject };
}
