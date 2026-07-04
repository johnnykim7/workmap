// 스프린트 기간 프리셋 순수 함수 테스트(CR-038).
import { describe, it, expect } from 'vitest';
import { endDateFor, presetFor } from './duration';

describe('endDateFor', () => {
  it('2주 프리셋 = 시작일 + 13일(시작일 포함 만 14일)', () => {
    expect(endDateFor('2W', '2026-07-06')).toBe('2026-07-19');
  });
  it('1주 프리셋 = 시작일 + 6일', () => {
    expect(endDateFor('1W', '2026-07-06')).toBe('2026-07-12');
  });
  it('4주 프리셋 = 시작일 + 27일', () => {
    expect(endDateFor('4W', '2026-07-06')).toBe('2026-08-02');
  });
  it('월 경계를 넘어가도 정확히 계산', () => {
    expect(endDateFor('1W', '2026-07-30')).toBe('2026-08-05');
  });
  it('CUSTOM이면 null', () => {
    expect(endDateFor('CUSTOM', '2026-07-06')).toBeNull();
  });
  it('시작일 없으면 null', () => {
    expect(endDateFor('2W', undefined)).toBeNull();
  });
});

describe('presetFor', () => {
  it('정확히 2주 간격이면 2W로 역산', () => {
    expect(presetFor('2026-07-06', '2026-07-19')).toBe('2W');
  });
  it('정확히 1주 간격이면 1W', () => {
    expect(presetFor('2026-07-06', '2026-07-12')).toBe('1W');
  });
  it('프리셋에 안 맞는 간격이면 CUSTOM', () => {
    expect(presetFor('2026-07-06', '2026-07-20')).toBe('CUSTOM');
  });
  it('기간이 비면 CUSTOM', () => {
    expect(presetFor(undefined, undefined)).toBe('CUSTOM');
  });
});
