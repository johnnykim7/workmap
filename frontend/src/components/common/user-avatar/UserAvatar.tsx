// 공통 사용자 아바타(CR-047, WMP-USER-001). 시스템 전반의 사용자 아이콘을 하나로 통일.
// - avatarUrl 있으면 이미지, 없으면 이름 이니셜(공통 initialOf).
// - userId가 있으면 클릭 시 UserProfileCard Popover(누구인지 식별). 없으면 표시만.
// 배경은 중립 톤(레이아웃·색상 절제 규칙). 기존 Avatar2/인라인 ds-ui Avatar/AssigneeAvatar 대체.
import { Popover, PopoverContent, PopoverTrigger, Tooltip, TooltipTrigger, TooltipContent } from '@therecommerce/ds-ui';
import { initialOf } from '@/features/chat/components/chat-utils';
import { UserProfileCard } from './UserProfileCard';

export type UserAvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<UserAvatarSize, string> = {
  xs: 'size-5 text-[10px]',
  sm: 'size-6 text-xs',
  md: 'size-8 text-sm',
  lg: 'size-12 text-base',
};

interface UserAvatarProps {
  userId?: number | null;
  name?: string | null;
  avatarUrl?: string | null;
  size?: UserAvatarSize;
  /** true면 클릭해도 카드 안 뜸(본인 편집 화면 등 표시 전용). 기본 false. */
  noCard?: boolean;
  className?: string;
}

function Circle({ name, avatarUrl, size, className }: Pick<UserAvatarProps, 'name' | 'avatarUrl' | 'size' | 'className'>) {
  const cls = SIZE_CLASS[size ?? 'sm'];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-foreground/70 ${cls} ${className ?? ''}`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name ?? ''} className="size-full object-cover" />
      ) : (
        initialOf(name)
      )}
    </span>
  );
}

export function UserAvatar({ userId, name, avatarUrl, size = 'sm', noCard = false, className }: UserAvatarProps) {
  const circle = <Circle name={name} avatarUrl={avatarUrl} size={size} className={className} />;

  // 신원(userId) 없거나 카드 비활성 → 이름 툴팁만(기존 Avatar2 동작 보존).
  if (userId == null || noCard) {
    if (!name) return circle;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{circle}</TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    );
  }

  // userId 있으면 클릭 시 프로필 카드.
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={name ? `${name} 프로필` : '사용자 프로필'} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {circle}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <UserProfileCard userId={userId} />
      </PopoverContent>
    </Popover>
  );
}
