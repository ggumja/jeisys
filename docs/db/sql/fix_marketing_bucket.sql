-- marketing 버킷 생성 (공개 버킷)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('marketing', 'marketing', true)
ON CONFLICT (id) DO NOTHING;

-- 모든 사용자 조회 권한 (광고 이미지 노출용)
CREATE POLICY "Public Access Marketing" ON storage.objects 
FOR SELECT USING ( bucket_id = 'marketing' );

-- 인증된 관리자 업로드 권한
CREATE POLICY "Admins can upload to marketing" ON storage.objects 
FOR INSERT WITH CHECK (
    bucket_id = 'marketing' 
    AND auth.role() = 'authenticated'
);

-- 인증된 관리자 수정 권한
CREATE POLICY "Admins can update marketing" ON storage.objects 
FOR UPDATE USING (
    bucket_id = 'marketing' 
    AND auth.role() = 'authenticated'
);

-- 인증된 관리자 삭제 권한
CREATE POLICY "Admins can delete from marketing" ON storage.objects 
FOR DELETE USING (
    bucket_id = 'marketing' 
    AND auth.role() = 'authenticated'
);
