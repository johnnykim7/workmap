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
}

export const useUiStore = create<UiState>((set) => ({
  createModalOpen: false,
  createModalPrefill: null,
  openCreateModal: () => set({ createModalOpen: true, createModalPrefill: null }),
  openCreateModalWith: (prefill) => set({ createModalOpen: true, createModalPrefill: prefill }),
  closeCreateModal: () => set({ createModalOpen: false, createModalPrefill: null }),
}));
