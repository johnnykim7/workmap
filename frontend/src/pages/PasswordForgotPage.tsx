// 비밀번호 찾기 (/password/forgot) — 공개. CR-027 토큰 보정, WMP-AUTH-007.
// 이메일 입력 → 재설정 링크 발송(계정 열거 방지: 항상 동일 성공 안내). 인증번호 입력 없음.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Map, MailCheck } from 'lucide-react';
import { Input, Button, Spinner, toast } from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import { authApi } from '@/features/auth/api';
import { ROUTES } from '@/lib/route-paths';
import { ApiError } from '@/lib/api-client';

const schema = z.object({
  email: z.string().min(1, '이메일을 입력하세요').email('이메일 형식이 아닙니다'),
});
type EmailForm = z.infer<typeof schema>;

export function PasswordForgotPage() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailForm>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = async (data: EmailForm) => {
    setSending(true);
    try {
      // 계정 열거 방지: 존재 여부와 무관하게 항상 성공 응답.
      await authApi.forgotPassword({ email: data.email });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '요청에 실패했습니다.');
    } finally {
      setSending(false);
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
            <div className="text-xs text-muted-foreground">재설정 링크 발송</div>
          </div>
        </div>

        {sent ? (
          <div className="py-6 text-center">
            <MailCheck className="mx-auto size-8 text-primary" />
            <p className="mt-3 text-sm text-foreground">가입된 계정이라면 재설정 링크를 보냈습니다.</p>
            <p className="mt-1 text-xs text-muted-foreground">메일의 "비밀번호 재설정" 버튼을 눌러 새 비밀번호를 설정하세요.</p>
            <Link to={ROUTES.login} className="mt-4 inline-block text-sm text-primary hover:underline">
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
            <Field label="이메일" required error={errors.email?.message} htmlFor="email">
              <Input id="email" type="email" placeholder="name@workmap.com" {...register('email')} />
            </Field>
            <Button type="submit" variant="primary" className="mt-2 w-full" disabled={sending}>
              {sending && <Spinner className="size-4" />}
              재설정 링크 받기
            </Button>
            <Link to={ROUTES.login} className="text-center text-xs text-primary hover:underline">
              로그인으로 돌아가기
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
