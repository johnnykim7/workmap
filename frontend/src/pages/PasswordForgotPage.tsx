// 비밀번호 찾기 (/password/forgot) — 공개. CR-027, WMP-AUTH-007.
// 1단계: 이메일 → 인증번호 발송(계정 열거 방지, 항상 성공 안내). 2단계: 인증번호 + 새 비밀번호.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Map } from 'lucide-react';
import { Input, Button, Spinner, toast } from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import { authApi } from '@/features/auth/api';
import { ROUTES } from '@/lib/route-paths';
import { ApiError } from '@/lib/api-client';

const emailSchema = z.object({
  email: z.string().min(1, '이메일을 입력하세요').email('이메일 형식이 아닙니다'),
});
type EmailForm = z.infer<typeof emailSchema>;

const resetSchema = z
  .object({
    code: z.string().length(6, '인증번호 6자리를 입력하세요'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다').max(72),
    confirm: z.string().min(1, '비밀번호를 한 번 더 입력하세요'),
  })
  .refine((v) => v.password === v.confirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirm'],
  });
type ResetForm = z.infer<typeof resetSchema>;

export function PasswordForgotPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema), defaultValues: { email: '' } });
  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: '', password: '', confirm: '' },
  });

  const onSendCode = async (data: EmailForm) => {
    setSending(true);
    try {
      // 계정 열거 방지: 존재 여부와 무관하게 항상 성공 응답.
      await authApi.forgotPassword({ email: data.email });
      setEmail(data.email);
      setStep(2);
      toast.success('가입된 계정이라면 인증번호를 보냈습니다.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '요청에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const onReset = async (data: ResetForm) => {
    setResetting(true);
    try {
      await authApi.resetPassword({ email, code: data.code, password: data.password });
      toast.success('비밀번호가 변경되었습니다. 로그인하세요.');
      navigate(ROUTES.login, { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '비밀번호 재설정에 실패했습니다.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-8 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Map className="size-5" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">비밀번호 찾기</div>
            <div className="text-xs text-muted-foreground">
              {step === 1 ? '1. 이메일 확인' : '2. 인증번호 · 새 비밀번호'}
            </div>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={emailForm.handleSubmit(onSendCode)} className="mt-6 flex flex-col gap-4">
            <Field label="이메일" required error={emailForm.formState.errors.email?.message} htmlFor="email">
              <Input id="email" type="email" placeholder="name@therecommerce.com" {...emailForm.register('email')} />
            </Field>
            <Button type="submit" variant="primary" className="mt-2 w-full" disabled={sending}>
              {sending && <Spinner className="size-4" />}
              인증번호 받기
            </Button>
          </form>
        ) : (
          <form onSubmit={resetForm.handleSubmit(onReset)} className="mt-6 flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">{email}로 보낸 인증번호를 입력하세요.</p>
            <Field label="인증번호" required error={resetForm.formState.errors.code?.message} htmlFor="code">
              <Input id="code" inputMode="numeric" maxLength={6} placeholder="6자리 숫자" {...resetForm.register('code')} />
            </Field>
            <Field label="새 비밀번호" required error={resetForm.formState.errors.password?.message} htmlFor="password">
              <Input id="password" type="password" placeholder="8자 이상" {...resetForm.register('password')} />
            </Field>
            <Field label="새 비밀번호 확인" required error={resetForm.formState.errors.confirm?.message} htmlFor="confirm">
              <Input id="confirm" type="password" placeholder="다시 입력" {...resetForm.register('confirm')} />
            </Field>
            <Button type="submit" variant="primary" className="mt-2 w-full" disabled={resetting}>
              {resetting && <Spinner className="size-4" />}
              비밀번호 변경
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(1)} disabled={resetting}>
              이메일 다시 입력
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to={ROUTES.login} className="text-primary hover:underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
