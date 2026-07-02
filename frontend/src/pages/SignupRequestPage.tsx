// 가입 요청 (/signup-request) — 공개. CR-032, WMP-AUTH-010.
// 이메일·이름·사유 신청 → 관리자 승인 시 초대 메일 발송. user는 만들지 않음.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Map, MailCheck } from 'lucide-react';
import { Input, Textarea, Button, Spinner, toast } from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import { authApi } from '@/features/auth/api';
import { ROUTES } from '@/lib/route-paths';
import { ApiError } from '@/lib/api-client';

const schema = z.object({
  email: z.string().min(1, '이메일을 입력하세요').email('이메일 형식이 아닙니다'),
  name: z.string().min(1, '이름을 입력하세요').max(50),
  reason: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

export function SignupRequestPage() {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', name: '', reason: '' },
  });

  const onSubmit = async (data: FormValues) => {
    setSending(true);
    try {
      await authApi.requestSignup({ email: data.email, name: data.name, reason: data.reason });
      setDone(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '가입 요청에 실패했습니다.');
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
            <div className="text-lg font-semibold text-foreground">가입 요청</div>
            <div className="text-xs text-muted-foreground">관리자 승인 후 초대 메일 발송</div>
          </div>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <MailCheck className="mx-auto size-8 text-primary" />
            <p className="mt-3 text-sm text-foreground">가입 요청을 접수했습니다.</p>
            <p className="mt-1 text-xs text-muted-foreground">관리자 승인 후 초대 메일을 받게 됩니다.</p>
            <Link to={ROUTES.login} className="mt-4 inline-block text-sm text-primary hover:underline">
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
            <Field label="이메일" required error={errors.email?.message} htmlFor="email">
              <Input id="email" type="email" placeholder="name@workmap.com" {...register('email')} />
            </Field>
            <Field label="이름" required error={errors.name?.message} htmlFor="name">
              <Input id="name" placeholder="이름" {...register('name')} />
            </Field>
            <Field label="사유(선택)" error={errors.reason?.message} htmlFor="reason">
              <Textarea id="reason" rows={3} placeholder="가입 사유·소속 등" {...register('reason')} />
            </Field>
            <Button type="submit" variant="primary" className="mt-2 w-full" disabled={sending}>
              {sending && <Spinner className="size-4" />}
              가입 요청 보내기
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
