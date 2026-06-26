// 전사 검색 훅 — 키워드/필터/정렬/페이징 검색(이전 데이터 유지). 퀵필터는 params 변형으로 표현.
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchApi, type SearchParams } from './api';

export const searchKey = (params: SearchParams) => ['search', params] as const;

export function useSearch(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: searchKey(params),
    queryFn: () => searchApi.search(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}
