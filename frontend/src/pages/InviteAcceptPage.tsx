// 초대 수락 (/invite/accept?token=...) — 공개. CR-027 토큰 보정, WMP-AUTH-006.
// 토큰으로 초대 정보 미리보기 → 새 비밀번호 설정 → user 생성·자동 로그인. 인증번호 입력 없음.
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, Link } from 'react-router-dom';
import { Map } from 'lucide-react';
import { Input, Button, Spinner } from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import { useAcceptInvitation } from '@/features/auth/hooks';
import { authApi, type InvitationPreview } from '@/features/auth/api';
import { ROUTES } from '@/lib/route-paths';

const schema = z
  .object({
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다').max(72),
    confirm: z.string().min(1, '비밀번호를 한 번 더 입력하세요'),
  })
  .refine((v) => v.password === v.confirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirm'],
  });
type FormValues = z.infer<typeof schema>;

export function InviteAcceptPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const accept = useAcceptInvitation();

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }
    authApi
      .previewInvitation(token)
      .then((p) => setPreview(p))
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  const onSubmit = (data: FormValues) => accept.mutate({ token, password: data.password });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-8 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Map className="size-5" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">WorkMap 가입</div>
            <div className="text-xs text-muted-foreground">초대 수락</div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="size-6" />
          </div>
        ) : invalid ? (
          <div className="py-6 text-center">
            <p className="text-sm text-foreground">초대 링크가 유효하지 않거나 만료되었습니다.</p>
            <p className="mt-1 text-xs text-muted-foreground">관리자에게 재발송을 요청하세요.</p>
            <Link to={ROUTES.login} className="mt-4 inline-block text-sm text-primary hover:underline">
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{preview?.email}</span> 계정으로 가입합니다. 사용할 비밀번호를 설정하세요.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Field label="비밀번호" required error={errors.password?.message} htmlFor="password">
                <Input id="password" type="password" placeholder="8자 이상" {...register('password')} />
              </Field>
              <Field label="비밀번호 확인" required error={errors.confirm?.message} htmlFor="confirm">
                <Input id="confirm" type="password" placeholder="다시 입력" {...register('confirm')} />
              </Field>
              <Button type="submit" variant="primary" className="mt-2 w-full" disabled={accept.isPending}>
                {accept.isPending && <Spinner className="size-4" />}
                가입 완료
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
