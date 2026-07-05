// 내 프로필 (/account/profile) — 인증 필요. CR-047, WMP-USER-001.
// 프로필 사진 업로드/제거(공통 첨부 업로드 재사용) + 이름·이메일·역할·부서(읽기).
// 사진 저장 = PATCH /users/me/avatar → 헤더 아바타·전 화면 즉시 반영.
import { useRef, useState } from 'react';
import { Button, Spinner, toast } from '@therecommerce/ds-ui';
import { Camera, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useUpdateMyAvatar } from '@/features/user/hooks';
import { uploadFile } from '@/lib/upload';
import { ROLE_LABEL } from '@/features/user/components/UserDialog';
import { UserAvatar } from '@/components/common/user-avatar';
import { PageHead } from '@/components/badges';
import { ApiError } from '@/lib/api-client';

export function AccountProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const updateAvatar = useUpdateMyAvatar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const busy = uploading || updateAvatar.isPending;

  const onPick = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 허용
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      await updateAvatar.mutateAsync(url);
      setUser({ avatarUrl: url });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const onRemove = async () => {
    try {
      await updateAvatar.mutateAsync(null);
      setUser({ avatarUrl: null });
    } catch {
      /* 훅 onError에서 토스트 처리 */
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl p-4">
      <PageHead desc="프로필 사진과 기본 정보를 관리합니다." />

      <div className="flex flex-col gap-6">
        {/* 아바타 + 사진 액션 */}
        <div className="flex items-center gap-4">
          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="lg" noCard />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {/* 사진 변경 = secondary(수정 액션), 파일 선택은 ds-ui Button 트리거(네이티브 file input 숨김) */}
              <Button variant="secondary" size="sm" onClick={onPick} disabled={busy}>
                {uploading ? <Spinner className="size-4" /> : <Camera className="size-4" />} 사진 변경
              </Button>
              {user.avatarUrl && (
                <Button variant="ghost" size="sm" onClick={onRemove} disabled={busy}>
                  <Trash2 className="size-4" /> 제거
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">JPG·PNG·GIF·WEBP, 최대 10MB.</p>
          </div>
        </div>

        {/* 읽기 전용 기본 정보 (역할·부서 변경은 관리자 화면에서) */}
        <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="text-muted-foreground">이름</dt>
          <dd className="text-foreground">{user.name}</dd>
          <dt className="text-muted-foreground">이메일</dt>
          <dd className="text-foreground">{user.email}</dd>
          <dt className="text-muted-foreground">역할</dt>
          <dd className="text-foreground">{ROLE_LABEL[user.role] ?? user.role}</dd>
        </dl>
      </div>

      {/* ds-ui 위젯 규칙: 네이티브 file input은 숨기고 Button으로 트리거 */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}
