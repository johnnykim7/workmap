// CR-019 — [+] 탭 추가 로직 + 템플릿 탭 프리셋 정합 단위 테스트 (DOM 무의존, node 환경).
import { describe, expect, it } from 'vitest';
import { nextActiveTabs, removeTab, moveTab, reorderTabs } from './project-tabs-util';
import { PROJECT_TAB_PRESET, PROJECT_TEMPLATES, PROJECT_TAB_LABEL } from '@/types/domain';

// route-paths 실존 8탭(정본).
const ALL_TABS = ['summary', 'list', 'board', 'backlog', 'timeline', 'calendar', 'approvals', 'reports'];

describe('nextActiveTabs — [+] 탭 추가', () => {
  it('탭추가_요약없는base_summary항상포함', () => {
    expect(nextActiveTabs(['board'], 'list')).toContain('summary');
  });

  it('탭추가_route순서로정렬됨', () => {
    // 입력 순서가 뒤죽박죽이어도 ALL_TABS 순서로 정렬
    const r = nextActiveTabs(['reports', 'board'], 'backlog');
    expect(r).toEqual(['summary', 'board', 'backlog', 'reports']);
  });

  it('탭추가_이미있는탭추가시_중복없음', () => {
    const r = nextActiveTabs(['summary', 'board'], 'board');
    expect(r).toEqual(['summary', 'board']);
  });

  it('탭추가_새탭_기존유지하며추가', () => {
    const r = nextActiveTabs(['summary', 'timeline'], 'calendar');
    expect(r).toEqual(['summary', 'timeline', 'calendar']);
  });

  it('탭추가_알수없는탭은무시됨', () => {
    // ALL_TABS에 없는 값(유령 'issues')은 결과에서 제외 — 유령 탭 방어
    const r = nextActiveTabs(['summary', 'issues'], 'board');
    expect(r).toEqual(['summary', 'board']);
    expect(r).not.toContain('issues');
  });
});

describe('removeTab — 탭 제거 (CR-020)', () => {
  it('제거_일반탭_제거됨', () => {
    expect(removeTab(['summary', 'board', 'list'], 'board')).toEqual(['summary', 'list']);
  });
  it('제거_summary_제거불가', () => {
    expect(removeTab(['summary', 'board'], 'summary')).toEqual(['summary', 'board']);
  });
  it('제거_유령값_같이정리됨', () => {
    expect(removeTab(['summary', 'issues', 'board'], 'board')).toEqual(['summary']);
  });
});

describe('moveTab — 탭 이동 (CR-020)', () => {
  it('이동_오른쪽', () => {
    expect(moveTab(['summary', 'board', 'list'], 'board', 1)).toEqual(['summary', 'list', 'board']);
  });
  it('이동_왼쪽', () => {
    expect(moveTab(['summary', 'board', 'list'], 'list', -1)).toEqual(['summary', 'list', 'board']);
  });
  it('이동_summary자리로는_못감', () => {
    // board가 왼쪽으로 가면 summary 자리 → 불가, 그대로
    expect(moveTab(['summary', 'board', 'list'], 'board', -1)).toEqual(['summary', 'board', 'list']);
  });
  it('이동_끝에서_오른쪽_불가', () => {
    expect(moveTab(['summary', 'board', 'list'], 'list', 1)).toEqual(['summary', 'board', 'list']);
  });
  it('이동_summary는_이동대상아님', () => {
    expect(moveTab(['summary', 'board'], 'summary', 1)).toEqual(['summary', 'board']);
  });
});

describe('reorderTabs — 드래그&드롭 재정렬 (CR-020)', () => {
  it('재정렬_뒤로이동', () => {
    expect(reorderTabs(['summary', 'board', 'list', 'reports'], 'board', 'reports'))
      .toEqual(['summary', 'list', 'reports', 'board']);
  });
  it('재정렬_앞으로이동', () => {
    expect(reorderTabs(['summary', 'board', 'list', 'reports'], 'reports', 'board'))
      .toEqual(['summary', 'reports', 'board', 'list']);
  });
  it('재정렬_summary는_드래그불가', () => {
    expect(reorderTabs(['summary', 'board'], 'summary', 'board'))
      .toEqual(['summary', 'board']);
  });
  it('재정렬_summary앞으로는_못놓음', () => {
    // board를 summary 위치로 → summary가 맨 앞 깨지면 원복
    expect(reorderTabs(['summary', 'board', 'list'], 'board', 'summary'))
      .toEqual(['summary', 'board', 'list']);
  });
  it('재정렬_같은위치_변화없음', () => {
    expect(reorderTabs(['summary', 'board'], 'board', 'board'))
      .toEqual(['summary', 'board']);
  });
});

describe('템플릿 탭 프리셋 정합 (CR-019 #14)', () => {
  it('모든프리셋_실존8탭만포함_유령없음', () => {
    for (const [type, tabs] of Object.entries(PROJECT_TAB_PRESET)) {
      for (const t of tabs) {
        expect(ALL_TABS, `${type} 프리셋의 '${t}'는 실존 탭이어야 함`).toContain(t);
      }
    }
  });

  it('모든프리셋_요약포함', () => {
    for (const [type, tabs] of Object.entries(PROJECT_TAB_PRESET)) {
      expect(tabs, `${type}는 summary 포함`).toContain('summary');
    }
  });

  it('기본형DEFAULT_8탭전부켜짐', () => {
    expect(PROJECT_TAB_PRESET.DEFAULT).toEqual(ALL_TABS);
  });

  it('PROJECT_TEMPLATES_defaultTabs와_PRESET_일치', () => {
    for (const tpl of PROJECT_TEMPLATES) {
      expect(tpl.defaultTabs, `${tpl.code} 템플릿 defaultTabs == PRESET`).toEqual(
        PROJECT_TAB_PRESET[tpl.code],
      );
    }
  });

  it('DEFAULT템플릿_5종전부_업무유형', () => {
    const def = PROJECT_TEMPLATES.find((t) => t.code === 'DEFAULT');
    expect(def?.issueTypeCodes).toEqual(['EPIC', 'STORY', 'TASK', 'BUG', 'SUBTASK']);
  });

  it('모든탭_라벨존재', () => {
    for (const t of ALL_TABS) {
      expect(PROJECT_TAB_LABEL[t], `${t} 라벨`).toBeTruthy();
    }
  });
});
