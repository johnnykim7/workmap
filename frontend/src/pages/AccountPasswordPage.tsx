// 비밀번호 변경 (/account/password) — 인증 필요. CR-027, WMP-AUTH-008.
// 현재 PW + [인증번호 발송]으로 받은 인증번호 + 새 PW (2차 인증).
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button, Spinner, toast } from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import { authApi } from '@/features/auth/api';
import { ApiError } from '@/lib/api-client';

const schema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요'),
    code: z.string().length(6, '인증번호 6자리를 입력하세요'),
    newPassword: z.string().min(8, '비밀번호는 8자 이상이어야 합니다').max(72),
    confirm: z.string().min(1, '비밀번호를 한 번 더 입력하세요'),
  })
  .refine((v) => v.newPassword === v.confirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirm'],
  });
type FormValues = z.infer<typeof schema>;

export function AccountPasswordPage() {
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', code: '', newPassword: '', confirm: '' },
  });

  const onSendCode = async () => {
    setSending(true);
    try {
      await authApi.requestChangeOtp();
      toast.success('가입 이메일로 인증번호를 보냈습니다.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '인증번호 발송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        code: data.code,
        newPassword: data.newPassword,
      });
      toast.success('비밀번호가 변경되었습니다.');
      reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-lg font-semibold text-foreground">비밀번호 변경</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        보안을 위해 현재 비밀번호와 이메일 인증번호를 함께 확인합니다.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="현재 비밀번호" required error={errors.currentPassword?.message} htmlFor="currentPassword">
          <Input id="currentPassword" type="password" placeholder="현재 비밀번호" {...register('currentPassword')} />
        </Field>

        <Field label="인증번호" required error={errors.code?.message} htmlFor="code">
          <div className="flex gap-2">
            <Input id="code" inputMode="numeric" maxLength={6} placeholder="6자리 숫자" {...register('code')} />
            <Button type="button" variant="secondary" onClick={onSendCode} disabled={sending} className="shrink-0">
              {sending && <Spinner className="size-4" />}
              인증번호 발송
            </Button>
          </div>
        </Field>

        <Field label="새 비밀번호" required error={errors.newPassword?.message} htmlFor="newPassword">
          <Input id="newPassword" type="password" placeholder="8자 이상" {...register('newPassword')} />
        </Field>
        <Field label="새 비밀번호 확인" required error={errors.confirm?.message} htmlFor="confirm">
          <Input id="confirm" type="password" placeholder="다시 입력" {...register('confirm')} />
        </Field>

        <Button type="submit" variant="primary" className="mt-2 w-full" disabled={saving}>
          {saving && <Spinner className="size-4" />}
          비밀번호 변경
        </Button>
      </form>
    </div>
  );
}
