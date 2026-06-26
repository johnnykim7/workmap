// 사용자 생성/수정 다이얼로그 (WMP-AUTH-004/005) — ds-ui Dialog + RHF + Zod.
// 생성: email/password/name/role/dept. 수정: name/role/dept만(email·password 불변).
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
import type { User, UserRole } from '@/types/domain';
import type { CreateUserRequest, UpdateUserRequest } from '../api';

export const ROLE_LABEL: Record<UserRole, string> = {
  OWNER: '소유자', ADMIN: '관리자', MANAGER: '매니저', MEMBER: '멤버', VIEWER: '뷰어',
};
const ROLES = Object.keys(ROLE_LABEL) as UserRole[];

const schema = z.object({
  email: z.string().trim().email('이메일 형식이 아닙니다.'),
  password: z.string().optional(),       // 생성 시만 검증(아래 superRefine)
  name: z.string().trim().min(1, '이름을 입력하세요.').max(50),
  role: z.string().min(1),
  departmentId: z.string().optional(),
});
type FormValues = z.input<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  editing?: User | null;
  onCreate: (body: CreateUserRequest) => void;
  onUpdate: (id: number, body: UpdateUserRequest) => void;
}

export function UserDialog({ open, onOpenChange, busy = false, editing, onCreate, onUpdate }: Props) {
  const isEdit = !!editing;
  const { register, handleSubmit, reset, control, setError, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', name: '', role: 'MEMBER', departmentId: '' },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? { email: editing.email, password: '', name: editing.name, role: editing.role, departmentId: editing.departmentId != null ? String(editing.departmentId) : '' }
        : { email: '', password: '', name: '', role: 'MEMBER', departmentId: '' },
    );
  }, [open, editing, reset]);

  const submit = handleSubmit((v) => {
    const dept = (v.departmentId ?? '').trim();
    const departmentId = dept ? Number(dept) : null;
    if (isEdit && editing) {
      onUpdate(editing.id, { name: v.name.trim(), role: v.role as UserRole, departmentId });
    } else {
      // 생성 시 비밀번호 필수(8~72).
      const pw = (v.password ?? '').trim();
      if (pw.length < 8 || pw.length > 72) {
        setError('password', { message: '비밀번호는 8~72자입니다.' });
        return;
      }
      onCreate({ email: v.email.trim(), password: pw, name: v.name.trim(), role: v.role as UserRole, departmentId });
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '사용자 수정' : '사용자 생성'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '이름·역할·부서를 수정합니다(이메일은 변경 불가).' : '새 사용자를 생성합니다(POL-004).'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <Field label="이메일" required error={errors.email?.message}>
            <Input type="email" placeholder="user@therecommerce.com" disabled={isEdit} {...register('email')} />
          </Field>

          {!isEdit && (
            <Field label="비밀번호" required error={errors.password?.message}>
              <Input type="password" placeholder="8~72자" {...register('password')} />
            </Field>
          )}

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
              {isEdit ? '수정' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
