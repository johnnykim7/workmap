import { create } from 'zustand';

// 전역 [만들기] 모달 프리필(선택) — 특정 화면이 모달을 열 때 미리 채울 값.
// 캘린더 빈칸 클릭(CR-021): 현재 프로젝트 + 클릭한 날짜를 마감일로 프리셋한다.
export interface CreateModalPrefill {
  projectId?: number;
  dueDate?: string; // yyyy-MM-dd
}

// 전역 UI 상태 (Zustand) — 서버 데이터가 아닌 클라이언트 UI 상태만.
// 전역 [만들기] 모달 열림 여부 등. 칸반 낙관적 업데이트 등은 각 feature에서.
interface UiState {
  createModalOpen: boolean;
  createModalPrefill: CreateModalPrefill | null;
  openCreateModal: () => void;
  openCreateModalWith: (prefill: CreateModalPrefill) => void;
  closeCreateModal: () => void;
  // 도움말 드로어 — 전역 상태로 둬야 헤더 ? 아이콘과 모달 안 ? 버튼이 같은 드로어를 연다.
  // (모달이 헤더를 가려 모달 안에서도 열 수 있어야 하므로. 목차가 하나뿐이라 섹션 인자는 없음.)
  helpOpen: boolean;
  openHelp: () => void;
  setHelpOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  createModalOpen: false,
  createModalPrefill: null,
  openCreateModal: () => set({ createModalOpen: true, createModalPrefill: null }),
  openCreateModalWith: (prefill) => set({ createModalOpen: true, createModalPrefill: prefill }),
  closeCreateModal: () => set({ createModalOpen: false, createModalPrefill: null }),
  helpOpen: false,
  openHelp: () => set({ helpOpen: true }),
  setHelpOpen: (open) => set({ helpOpen: open }),
}));
