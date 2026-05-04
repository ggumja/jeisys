-- posts 테이블에 썸네일 URL 컬럼 추가
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN posts.thumbnail_url IS '뉴스 목록 썸네일 이미지 URL';
