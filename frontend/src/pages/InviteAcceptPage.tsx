// 초대 수락 (/invite/accept) — 공개. CR-027, WMP-AUTH-006.
// 초대 이메일 링크(?email=)로 진입 → 인증번호 + 비밀번호 설정 → user 생성 + 자동 로그인.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, Link } from 'react-router-dom';
import { Map } from 'lucide-react';
import { Input, Button, Spinner } from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import { useAcceptInvitation } from '@/features/auth/hooks';
import { ROUTES } from '@/lib/route-paths';

const schema = z
  .object({
    email: z.string().min(1, '이메일을 입력하세요').email('이메일 형식이 아닙니다'),
    code: z.string().length(6, '인증번호 6자리를 입력하세요'),
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
  const accept = useAcceptInvitation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.get('email') ?? '', code: '', password: '', confirm: '' },
  });

  const onSubmit = (data: FormValues) =>
    accept.mutate({ email: data.email, code: data.code, password: data.password });

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
        <p className="mb-6 text-xs text-muted-foreground">
          초대 이메일로 받은 인증번호를 입력하고 사용할 비밀번호를 설정하세요.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="이메일" required error={errors.email?.message} htmlFor="email">
            <Input id="email" type="email" placeholder="name@workmap.com" {...register('email')} />
          </Field>
          <Field label="인증번호" required error={errors.code?.message} htmlFor="code">
            <Input id="code" inputMode="numeric" maxLength={6} placeholder="6자리 숫자" {...register('code')} />
          </Field>
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

        <p className="mt-4 text-center text-xs text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link to={ROUTES.login} className="text-primary hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
