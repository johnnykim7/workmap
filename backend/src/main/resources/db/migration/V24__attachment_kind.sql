-- CR-051 (WMP-WI-012, BIZ-118): 첨부 성격 구분 — 참고자료(REFERENCE, 입력) vs 결과물(RESULT, 산출물).
-- CR-048 결과 섹션이 본문 첨부와 같은 저장소를 공유해 같은 파일이 양쪽에 중복 표시되던 문제 해결.
-- 저장소·API는 단일 유지, kind로 분리 조회(?kind= 필터). 기존 첨부는 DEFAULT로 REFERENCE 백필.
ALTER TABLE attachments ADD COLUMN kind VARCHAR(20) NOT NULL DEFAULT 'REFERENCE';
CREATE INDEX idx_attachments_kind ON attachments (work_item_id, kind);
