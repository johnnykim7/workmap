-- CR-047: 사용자 프로필 사진(아바타) URL. null=이니셜 폴백.
-- 업로드는 기존 파일 업로드(POST /files/upload, CR-024 이미지 화이트리스트) 재사용,
-- 반환된 /files/serve/* URL을 여기 저장한다.
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
