// 인수조건 진척률·미충족 계산 단위테스트 (CR-049, WMP-WI-018).
import { describe, it, expect } from 'vitest';
import { unmetCount, metProgress } from './acceptance-criteria';
import type { AcceptanceCriterion } from '@/types/domain';

const c = (text: string, checked: boolean): AcceptanceCriterion => ({ text, checked });

describe('unmetCount — 미충족 항목 수', () => {
  it('일부 미충족', () => {
    expect(unmetCount([c('a', true), c('b', false), c('c', false)])).toBe(2);
  });
  it('전부 충족이면 0', () => {
    expect(unmetCount([c('a', true), c('b', true)])).toBe(0);
  });
  it('빈 배열·null·undefined는 0', () => {
    expect(unmetCount([])).toBe(0);
    expect(unmetCount(null)).toBe(0);
    expect(unmetCount(undefined)).toBe(0);
  });
});

describe('metProgress — 충족 N / 전체 M', () => {
  it('3개 중 1개 충족', () => {
    expect(metProgress([c('a', true), c('b', false), c('c', false)])).toEqual({ met: 1, total: 3 });
  });
  it('빈 배열은 0/0', () => {
    expect(metProgress([])).toEqual({ met: 0, total: 0 });
    expect(metProgress(null)).toEqual({ met: 0, total: 0 });
  });
});
