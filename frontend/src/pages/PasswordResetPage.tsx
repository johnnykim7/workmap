// 비밀번호 재설정 (/password/reset?token=...) — 공개. CR-027 토큰 보정, WMP-AUTH-007.
// 재설정 이메일 링크로 진입 → 토큰 + 새 비밀번호 → 변경 후 로그인. 인증번호 입력 없음.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Map } from 'lucide-react';
import { Input, Button, Spinner, toast } from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import { authApi } from '@/features/auth/api';
import { ROUTES } from '@/lib/route-paths';
import { ApiError } from '@/lib/api-client';

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

export function PasswordResetPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      await authApi.resetPassword({ token, password: data.password });
      toast.success('비밀번호가 변경되었습니다. 로그인하세요.');
      navigate(ROUTES.login, { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '재설정 링크가 유효하지 않거나 만료되었습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Map className="size-5" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">비밀번호 재설정</div>
            <div className="text-xs text-muted-foreground">새 비밀번호 설정</div>
          </div>
        </div>

        {!token ? (
          <div className="py-6 text-center">
            <p className="text-sm text-foreground">재설정 링크가 유효하지 않습니다.</p>
            <Link to={ROUTES.passwordForgot} className="mt-3 inline-block text-sm text-primary hover:underline">
              다시 요청하기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field label="새 비밀번호" required error={errors.password?.message} htmlFor="password">
              <Input id="password" type="password" placeholder="8자 이상" {...register('password')} />
            </Field>
            <Field label="새 비밀번호 확인" required error={errors.confirm?.message} htmlFor="confirm">
              <Input id="confirm" type="password" placeholder="다시 입력" {...register('confirm')} />
            </Field>
            <Button type="submit" variant="primary" className="mt-2 w-full" disabled={saving}>
              {saving && <Spinner className="size-4" />}
              비밀번호 변경
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
