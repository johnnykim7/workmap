import { create } from 'zustand';

// 전역 UI 상태 (Zustand) — 서버 데이터가 아닌 클라이언트 UI 상태만.
// 전역 [만들기] 모달 열림 여부 등. 칸반 낙관적 업데이트 등은 각 feature에서.
interface UiState {
  createModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  createModalOpen: false,
  openCreateModal: () => set({ createModalOpen: true }),
  closeCreateModal: () => set({ createModalOpen: false }),
}));
