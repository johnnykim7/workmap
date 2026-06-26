import { Inbox } from 'lucide-react';
import { StubPage } from '@/components/common/stub-page';

// 받은함 (/inbox) — 내게 온 알림·멘션·배정 통합. Sprint5.
export function InboxPage() {
  return <StubPage title="받은함" desc="내게 온 알림·멘션·배정" sprint="Sprint5" icon={<Inbox className="size-6" />} />;
}
