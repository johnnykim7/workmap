// 전사 검색 훅 — 키워드/필터/정렬/페이징 검색(이전 데이터 유지). 퀵필터는 params 변형으로 표현.
// 검색도 선택 WS 컨텍스트로 좁힘(CR-018) — 훅이 store에서 currentWorkspaceId를 주입.
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchApi, type SearchParams } from './api';
import { useWorkspaceStore } from '@/store/workspace-store';

export const searchKey = (params: SearchParams) => ['search', params] as const;

export function useSearch(params: SearchParams, enabled = true) {
  const wsId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const scoped: SearchParams = { ...params, workspaceId: wsId ?? undefined };
  return useQuery({
    queryKey: searchKey(scoped),
    queryFn: () => searchApi.search(scoped),
    enabled,
    placeholderData: keepPreviousData,
  });
}
