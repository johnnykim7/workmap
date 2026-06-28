// 알림 수신 설정 훅 — 조회 + 부분 upsert(저장 시 invalidate). (CR-028, WMP-NOTI-003)
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { notificationPrefApi, type PreferenceItem } from './api';

export const notificationPrefKeys = {
  list: ['notification-preferences'] as const,
};

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationPrefKeys.list,
    queryFn: () => notificationPrefApi.list(),
  });
}

// 변경된 종류만 보내 upsert. 성공 시 토스트 + invalidate.
export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: PreferenceItem[]) => notificationPrefApi.update(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationPrefKeys.list });
      toast.success('알림 설정을 저장했습니다.');
    },
    onError: () => toast.error('알림 설정 저장에 실패했습니다.'),
  });
}
