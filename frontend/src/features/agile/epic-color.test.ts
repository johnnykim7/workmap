// Epic별 고유 색(CR-036) 순수 함수 테스트 — node 환경(DOM 무의존).
import { describe, expect, it } from 'vitest';
import { epicColor } from './epic-color';

describe('epicColor', () => {
  it('같은_epicId면_항상_같은_색', () => {
    expect(epicColor(42)).toBe(epicColor(42));
    expect(epicColor(1001)).toBe(epicColor(1001));
  });

  it('null·undefined·NaN이면_violet_기본', () => {
    expect(epicColor(null)).toBe('violet');
    expect(epicColor(undefined)).toBe('violet');
    expect(epicColor(NaN)).toBe('violet');
  });

  it('반환색은_항상_팔레트_내부값', () => {
    const palette = ['blue', 'green', 'amber', 'red', 'slate', 'violet'];
    for (let id = 1; id <= 200; id++) {
      expect(palette).toContain(epicColor(id));
    }
  });

  it('서로_다른_Epic들은_색이_퍼진다(2종_이상)', () => {
    // 결정적 해시라 특정 분포를 단정하진 않되, 20개 id가 한 색에만 몰리지 않음을 확인.
    const colors = new Set(Array.from({ length: 20 }, (_, i) => epicColor(i + 1)));
    expect(colors.size).toBeGreaterThan(1);
  });
});
