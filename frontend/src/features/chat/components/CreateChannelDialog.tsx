// 채널 생성 다이얼로그 — LNB로 채널이 이동하며 ChannelSidebar에서 분리(재사용).
import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
} from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import { useChannelMutations } from '../hooks';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: number | null;
  onCreated: (id: number) => void;
}

export function CreateChannelDialog({ open, onOpenChange, workspaceId, onCreated }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { create } = useChannelMutations(workspaceId);

  const reset = () => {
    setDisplayName('');
    setName('');
    setDescription('');
  };

  const submit = () => {
    if (workspaceId == null || !displayName.trim()) return;
    const slug =
      name.trim() ||
      displayName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    create.mutate(
      {
        workspaceId,
        name: slug || displayName.trim(),
        displayName: displayName.trim(),
        description: description.trim() || null,
      },
      {
        onSuccess: (ch) => {
          onOpenChange(false);
          reset();
          onCreated(ch.id);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>채널 만들기</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <Field label="채널 이름" required htmlFor="ch-display">
            <Input
              id="ch-display"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="예: 공지사항"
            />
          </Field>
          <Field label="식별자(slug)" htmlFor="ch-slug">
            <Input
              id="ch-slug"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="비우면 이름에서 자동 생성"
            />
          </Field>
          <Field label="설명" htmlFor="ch-desc">
            <Textarea
              id="ch-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="채널 용도를 간단히"
              rows={2}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={!displayName.trim() || workspaceId == null || create.isPending}
          >
            만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
