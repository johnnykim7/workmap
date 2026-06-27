import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 선택된 워크스페이스 컨텍스트 (CR-018, WMP-WS-008).
// WS = 슬랙식 격리 작업공간. 선택은 localStorage에 기억되어 다음 로그인 시 자동 진입.
// 단 "기억"은 클라이언트 편의일 뿐 — 실제 격리는 서버가 멤버십으로 강제(BIZ-112).
// 진입 시 GET /workspaces(내 WS만)에 선택 id가 없으면 무효 처리 → 선택 화면으로.
interface WorkspaceState {
  /** 현재 선택된 WS id. null이면 미선택(선택 화면으로). */
  currentWorkspaceId: number | null;
  setWorkspace: (id: number) => void;
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspaceId: null,
      setWorkspace: (id) => set({ currentWorkspaceId: id }),
      clearWorkspace: () => set({ currentWorkspaceId: null }),
    }),
    { name: 'workmap-workspace' },
  ),
);
