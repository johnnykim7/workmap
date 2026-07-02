-- CR-033 | 초대에 워크스페이스 지정. 수락 시 그 WS 멤버로 자동 합류(빈 WS 선택 화면 해소).
-- nullable — WS 없이 초대도 허용(가입 후 미소속, 관리자가 별도 추가).
ALTER TABLE invitations ADD COLUMN workspace_id BIGINT;
