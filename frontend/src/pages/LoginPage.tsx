// 로그인 (/login) — 공개. POST /auth/login 실연동(Sprint 2).
// 성공 → Zustand 세션 저장 후 회사홈. 실패 → 토스트(에러 메시지).
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Map } from 'lucide-react';
import { Input, Button, Spinner } from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import { useLogin } from '@/features/auth/hooks';

const schema = z.object({
  email: z.string().min(1, '이메일을 입력하세요').email('이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});
type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginForm) => login.mutate(data);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Map className="size-5" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">WorkMap</div>
            <div className="text-xs text-muted-foreground">업무지도</div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="이메일" required error={errors.email?.message} htmlFor="email">
            <Input id="email" type="email" placeholder="name@therecommerce.com" {...register('email')} />
          </Field>
          <Field label="비밀번호" required error={errors.password?.message} htmlFor="password">
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
          </Field>
          <Button type="submit" variant="primary" className="mt-2 w-full" disabled={login.isPending}>
            {login.isPending && <Spinner className="size-4" />}
            로그인
          </Button>
        </form>

        {/* 가입 안내 — self-signup 부재(WMP-AUTH-004 관리자 초대 모델). #1 */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          계정이 없으신가요? 관리자에게 계정 생성을 요청하세요.
        </p>

        {/* 안내 계정. 운영 계정 정책 확정 시 제거. */}
        <p className="mt-2 text-center text-xs text-muted-foreground/70">
          admin@workmap.com / admin1234
        </p>
      </div>
    </div>
  );
}
