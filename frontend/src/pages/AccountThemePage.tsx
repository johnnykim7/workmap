// 화면 테마 설정 (/account/theme) — 인증 필요. 개인별 프리셋 선택(localStorage).
// 면 2개(LNB 톤 + 포인트색)를 묶은 프리셋 6종을 카드로. 클릭=즉시 전체 화면 적용(미리보기=실적용).
// 상태색·본문 바탕은 테마와 무관(의미색·가독성 보존) — 설명에 명시.
import { Check } from 'lucide-react';
import { useThemeStore } from '@/store/theme-store';
import { THEME_PRESETS, type ThemePreset } from '@/lib/themes';

/** 프리셋 한 장 미리보기 — 실제 LNB 톤·활성·포인트색 스와치를 미니 레이아웃으로. */
function PresetCard({ preset, selected, onSelect }: {
  preset: ThemePreset;
  selected: boolean;
  onSelect: () => void;
}) {
  const v = preset.vars;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative flex flex-col gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected ? 'border-primary ring-2 ring-ring' : 'border-border hover:border-primary/40'
      }`}
    >
      {/* 미니 화면 미리보기: 좌측 LNB + 우측 본문(흰색 고정) + 활성/버튼 스와치 */}
      <div className="flex h-20 overflow-hidden rounded-md border border-border">
        {/* LNB */}
        <div className="flex w-1/3 flex-col gap-1 p-1.5" style={{ background: v.sidebar }}>
          <div className="h-1.5 w-3/4 rounded-full" style={{ background: v['sidebar-foreground'], opacity: 0.5 }} />
          {/* 활성 메뉴 */}
          <div className="h-3 w-full rounded" style={{ background: v['sidebar-primary'] }} />
          <div className="h-1.5 w-2/3 rounded-full" style={{ background: v['sidebar-foreground'], opacity: 0.5 }} />
        </div>
        {/* 본문(테마 바탕 틴트) + 포인트색 버튼 */}
        <div className="flex flex-1 flex-col items-end gap-1.5 p-1.5" style={{ background: v.background }}>
          <div className="h-3 w-10 rounded" style={{ background: v.primary }} />
          <div className="h-1.5 w-full rounded-full bg-slate-200" />
          <div className="h-1.5 w-4/5 rounded-full bg-slate-200" />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5 text-sm font-medium">
          {preset.name}
          {selected && <Check className="size-4 text-primary" />}
        </div>
        <div className="text-xs text-muted-foreground">{preset.desc}</div>
      </div>
    </button>
  );
}

export function AccountThemePage() {
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-1 text-lg font-semibold">화면 테마</div>
      <p className="mb-5 text-sm text-muted-foreground">
        사이드바 톤과 강조색을 고릅니다. 선택하면 즉시 전체 화면에 적용되고 이 브라우저에 저장됩니다.
        업무 상태색(완료·막힘 등)과 본문 배경은 테마와 무관하게 유지됩니다.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {THEME_PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            selected={preset.id === themeId}
            onSelect={() => setTheme(preset.id)}
          />
        ))}
      </div>
    </div>
  );
}
