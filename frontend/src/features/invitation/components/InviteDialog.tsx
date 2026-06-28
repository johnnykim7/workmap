// 사용자 초대 다이얼로그 (WMP-AUTH-004, CR-027) — ds-ui Dialog + RHF + Zod.
// 이메일·이름·역할·부서만 입력(비밀번호 없음). 초대 시 인증번호 이메일 발송, user는 수락 시 생성.
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Spinner,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import { ROLE_LABEL } from '@/features/user/components/UserDialog';
import type { UserRole } from '@/types/domain';
import type { InviteRequest } from '../api';

const ROLES = Object.keys(ROLE_LABEL) as UserRole[];

const schema = z.object({
  email: z.string().trim().email('이메일 형식이 아닙니다.'),
  name: z.string().trim().min(1, '이름을 입력하세요.').max(50),
  role: z.string().min(1),
  departmentId: z.string().optional(),
});
type FormValues = z.input<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  onInvite: (body: InviteRequest) => void;
}

export function InviteDialog({ open, onOpenChange, busy = false, onInvite }: Props) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', name: '', role: 'MEMBER', departmentId: '' },
  });

  useEffect(() => {
    if (open) reset({ email: '', name: '', role: 'MEMBER', departmentId: '' });
  }, [open, reset]);

  const submit = handleSubmit((v) => {
    const dept = (v.departmentId ?? '').trim();
    onInvite({
      email: v.email.trim(),
      name: v.name.trim(),
      role: v.role as UserRole,
      departmentId: dept ? Number(dept) : null,
    });
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>사용자 초대</DialogTitle>
          <DialogDescription>
            이메일로 인증번호를 보냅니다. 초대받은 사람이 인증번호 입력·비밀번호 설정을 마치면 계정이 생성됩니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <Field label="이메일" required error={errors.email?.message}>
            <Input type="email" placeholder="user@therecommerce.com" {...register('email')} />
          </Field>
          <Field label="이름" required error={errors.name?.message}>
            <Input placeholder="이름" {...register('name')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="역할" required error={errors.role?.message}>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="부서 ID(선택)" error={errors.departmentId?.message}>
              <Input type="number" min={1} placeholder="부서 id" {...register('departmentId')} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy && <Spinner className="size-4" />}
              초대 보내기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
