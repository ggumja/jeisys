-- ads 테이블의 placement enum 타입에 sub_banner 추가
-- 실행 위치: Supabase SQL Editor
-- 작성일: 2026-05-04

ALTER TYPE ad_placement_type ADD VALUE IF NOT EXISTS 'sub_banner';
