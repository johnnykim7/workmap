// 공통 사용자 프로필 카드(CR-047, WMP-USER-001).
// UserAvatar 클릭 시 Popover 콘텐츠로 열린다. GET /users/{id}로 상세를 채운다(조회 전용).
import { Skeleton } from '@therecommerce/ds-ui';
import { Mail, Building2, CalendarDays } from 'lucide-react';
import { useUser } from '@/features/user/hooks';
import { ROLE_LABEL } from '@/features/user/components/UserDialog';
import { initialOf } from '@/features/chat/components/chat-utils';

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function UserProfileCard({ userId }: { userId: number }) {
  const { data, isPending, isError } = useUser(userId);

  if (isPending) {
    return (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-3 w-40" />
      </div>
    );
  }

  if (isError || !data) {
    return <div className="p-2 text-sm text-muted-foreground">사용자 정보를 불러오지 못했습니다.</div>;
  }

  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex items-center gap-3">
        {/* 아바타는 중립 톤(레이아웃·색상 절제). 사진 있으면 이미지, 없으면 이니셜. */}
        <span className="inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-base font-medium text-foreground/70">
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt={data.name} className="size-full object-cover" />
          ) : (
            initialOf(data.name)
          )}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{data.name}</span>
            {/* 역할만 신호색(RoleBadge 규칙 재사용) */}
            <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
              {ROLE_LABEL[data.role] ?? data.role}
            </span>
          </div>
          {!data.active && <span className="text-xs text-muted-foreground">비활성 계정</span>}
        </div>
      </div>

      <dl className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Mail className="size-3.5 shrink-0" />
          <span className="truncate">{data.email}</span>
        </div>
        {data.departmentName && (
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 shrink-0" />
            <span className="truncate">{data.departmentName}</span>
          </div>
        )}
        {data.createdAt && (
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 shrink-0" />
            <span>가입 {fmtDate(data.createdAt)}</span>
          </div>
        )}
      </dl>
    </div>
  );
}
