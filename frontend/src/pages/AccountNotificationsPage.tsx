// 알림 수신 설정 (/account/notifications) — 인증 필요. CR-028, WMP-NOTI-003.
// 행=알림 종류, 열=인앱/이메일/푸시 Switch 매트릭스. 미설정은 기본값(인앱 ON·외부 OFF).
// 인앱 받은함 기록 자체는 항상(원장) — 인앱 토글은 표시/배지 범위만 제어.
import { useEffect, useMemo, useState } from 'react';
import {
  Switch,
  Button,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@therecommerce/ds-ui';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/notification-pref/hooks';
import {
  NOTIFICATION_TYPE_LABELS,
  type PreferenceItem,
} from '@/features/notification-pref/api';

type Channel = 'inApp' | 'email' | 'push';

export function AccountNotificationsPage() {
  const { data, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  // 서버 설정을 로컬로 복사해 편집. type → item.
  const [draft, setDraft] = useState<Record<string, PreferenceItem>>({});

  useEffect(() => {
    if (data) {
      const map: Record<string, PreferenceItem> = {};
      for (const it of data.items) map[it.type] = it;
      setDraft(map);
    }
  }, [data]);

  // 변경 여부(서버 대비) — 변경된 종류만 저장 대상.
  const dirtyItems = useMemo(() => {
    if (!data) return [];
    const orig: Record<string, PreferenceItem> = {};
    for (const it of data.items) orig[it.type] = it;
    return Object.values(draft).filter((d) => {
      const o = orig[d.type];
      return !o || o.inApp !== d.inApp || o.email !== d.email || o.push !== d.push;
    });
  }, [draft, data]);

  function toggle(type: string, channel: Channel, value: boolean) {
    setDraft((prev) => ({ ...prev, [type]: { ...prev[type], [channel]: value } }));
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const rows = data?.items ?? [];

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-1 text-lg font-semibold">알림 설정</div>
      <p className="mb-4 text-sm text-muted-foreground">
        알림 종류별로 받을 채널을 선택합니다. 인앱은 받은함 표시 여부이며, 받은함 기록 자체는 항상 보관됩니다.
        푸시(브라우저 알림)는 준비 중입니다.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>알림 종류</TableHead>
            <TableHead className="w-20 text-center">인앱</TableHead>
            <TableHead className="w-20 text-center">이메일</TableHead>
            <TableHead className="w-24 text-center">
              푸시
              <span className="block text-[10px] font-normal text-muted-foreground">준비 중</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const d = draft[row.type] ?? row;
            return (
              <TableRow key={row.type}>
                <TableCell>{NOTIFICATION_TYPE_LABELS[row.type] ?? row.type}</TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={d.inApp}
                    onCheckedChange={(v) => toggle(row.type, 'inApp', v)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={d.email}
                    onCheckedChange={(v) => toggle(row.type, 'email', v)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  {/* 웹푸시(Firebase/SW)는 후속 — 현재 비활성. BE 푸시 발송 경로는 준비됨. */}
                  <Switch checked={d.push} disabled aria-label="푸시(준비 중)" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="mt-4 flex justify-end">
        <Button
          variant="primary"
          disabled={dirtyItems.length === 0 || update.isPending}
          onClick={() => update.mutate(dirtyItems)}
        >
          저장
        </Button>
      </div>
    </div>
  );
}
