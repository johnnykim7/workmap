// 댓글(@멘션) — §9.3. GET/POST /work-items/{id}/comments. authorId/mention은 멤버 목록으로 이름 해소.
// 멘션: 본문의 @이름 토큰을 멤버명과 매칭해 mentionedUserIds로 전송(간이 매칭).
import { useState } from 'react';
import { Button, Textarea, Spinner, Avatar, AvatarFallback } from '@therecommerce/ds-ui';
import { fmtDateTime } from '@/lib/date';
import { useMembers } from '@/features/members/hooks';
import { type WorkItemResponse } from '@/types/domain';
import { useComments, useCreateComment } from '../hooks';

export function CommentThread({ item }: { item: WorkItemResponse }) {
  const { data: comments = [], isPending } = useComments(item.id);
  const { data: members = [] } = useMembers(item.projectId);
  const create = useCreateComment(item.id);
  const [draft, setDraft] = useState('');

  const nameOf = (id?: number | null) => (id != null ? members.find((m) => m.userId === id)?.name : undefined) ?? '알 수 없음';

  function submit() {
    const content = draft.trim();
    if (!content) return;
    // @이름 토큰 → 멤버 매칭(공백 없는 이름 기준 간이 매칭).
    const mentioned = members.filter((m) => content.includes(`@${m.name}`)).map((m) => m.userId);
    create.mutate({ content, mentionedUserIds: mentioned }, { onSuccess: () => setDraft('') });
  }

  return (
    <section>
      <h2 className="mb-1.5 text-sm font-semibold text-foreground">댓글</h2>

      <div className="mb-3 flex flex-col gap-2">
        <Textarea
          rows={2}
          placeholder="댓글 입력 (@이름으로 멘션)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex justify-end">
          <Button variant="primary" size="sm" disabled={create.isPending || !draft.trim()} onClick={submit}>
            {create.isPending && <Spinner className="size-4" />} 등록
          </Button>
        </div>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 댓글이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2">
              <Avatar className="size-7 shrink-0"><AvatarFallback className="text-xs">{nameOf(c.authorId)[0]}</AvatarFallback></Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-foreground">{nameOf(c.authorId)}</span>
                  <span className="text-muted-foreground">{fmtDateTime(c.createdAt)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
