// 결과(완료 산출물) 섹션 노출 게이트 (WMP-WI-017, CR-048).
// 완료 상태(STATUS_CATEGORY==='DONE', 즉 DONE·OPS_APPLIED)일 때만 결과 섹션을 노출한다.
// React 무의존 순수 함수 — node 환경 단위테스트 가능(레포 jsdom ERR_REQUIRE_ESM 회피).
import { type WorkItemResponse, STATUS_CATEGORY } from '@/types/domain';

export function isDoneStatus(item: Pick<WorkItemResponse, 'commonStatus'>): boolean {
  return STATUS_CATEGORY[item.commonStatus] === 'DONE';
}
