// 활동 영역 탭(§9.3, Jira 정합) — [전체 / 댓글 / 이력]. 기본=댓글.
// 전체=댓글+활동이력을 시간순 병합해 한 줄씩. 댓글=CommentThread, 이력=ActivityFeed 재사용.
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@therecommerce/ds-ui';
import { UserAvatar } from '@/components/common/user-avatar';
import { fmtDateTime } from '@/lib/date';
import { useMembers } from '@/features/members/hooks';
import { type WorkItemResponse } from '@/types/domain';
import { useComments, useActivities } from '../hooks';
import { CommentThread } from './CommentThread';
import { ActivityFeed, ACTION_LABEL } from './ActivityFeed';

export function ActivityTabs({ item }: { item: WorkItemResponse }) {
  const [tab, setTab] = useState('comments');

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-foreground">활동</h2>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" className="mb-3">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="comments">댓글</TabsTrigger>
          <TabsTrigger value="history">이력</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <AllTimeline item={item} />
        </TabsContent>
        <TabsContent value="comments">
          <CommentThread item={item} />
        </TabsContent>
        <TabsContent value="history">
          <ActivityFeed item={item} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

// 전체 = 댓글 + 활동이력을 createdAt 오름차순(최신 아래)로 병합.
function AllTimeline({ item }: { item: WorkItemResponse }) {
  const { data: comments = [], isPending: cLoading } = useComments(item.id);
  const { data: activities = [], isPending: aLoading } = useActivities(item.id);
  const { data: members = [] } = useMembers(item.projectId);
  const nameOf = (id?: number | null) =>
    (id != null ? members.find((m) => m.userId === id)?.name : undefined) ?? '알 수 없음';

  if (cLoading || aLoading) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;

  const rows = [
    ...comments.map((c) => ({ kind: 'comment' as const, at: c.createdAt, actorId: c.authorId, content: c.content, id: `c${c.id}` })),
    ...activities.map((a) => ({
      kind: 'activity' as const, at: a.createdAt, actorId: a.actorId, id: `a${a.id}`,
      content: (ACTION_LABEL[a.action] ?? a.action) + ((a.fromValue || a.toValue) ? ` : ${a.fromValue ?? '–'} → ${a.toValue ?? '–'}` : ''),
    })),
  ].sort((x, y) => x.at.localeCompare(y.at));

  if (rows.length === 0) return <p className="text-sm text-muted-foreground">활동이 없습니다.</p>;

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="flex items-start gap-2 text-sm">
          <UserAvatar userId={r.actorId} name={nameOf(r.actorId)} size="sm" />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-foreground">{nameOf(r.actorId)}</span>
              {r.kind === 'activity' && <span className="text-muted-foreground">활동</span>}
              <span className="text-muted-foreground">{fmtDateTime(r.at)}</span>
            </div>
            {r.kind === 'comment' ? (
              <p className="mt-0.5 whitespace-pre-wrap text-foreground">{r.content}</p>
            ) : (
              <p className="mt-0.5 text-muted-foreground">{r.content}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
