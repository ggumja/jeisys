-- 광고 지면 타입 정의
DO $$ BEGIN
    CREATE TYPE ad_placement_type AS ENUM ('main_banner', 'email_banner', 'popup', 'side_banner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 광고 정보 테이블
CREATE TABLE IF NOT EXISTS ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  placement ad_placement_type NOT NULL,
  image_pc_url TEXT,
  image_mobile_url TEXT,
  link_url TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 광고 통계 집계 테이블 (일별)
CREATE TABLE IF NOT EXISTS ad_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  stat_date DATE DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  UNIQUE(ad_id, stat_date)
);

-- 통계 업데이트를 위한 RPC 함수 (노출/클릭 증가)
CREATE OR REPLACE FUNCTION track_ad_event(target_ad_id UUID, event_type TEXT)
RETURNS VOID AS $$
BEGIN
  IF event_type = 'impression' THEN
    INSERT INTO ad_stats (ad_id, stat_date, impressions)
    VALUES (target_ad_id, CURRENT_DATE, 1)
    ON CONFLICT (ad_id, stat_date)
    DO UPDATE SET impressions = ad_stats.impressions + 1;
  ELSIF event_type = 'click' THEN
    INSERT INTO ad_stats (ad_id, stat_date, clicks)
    VALUES (target_ad_id, CURRENT_DATE, 1)
    ON CONFLICT (ad_id, stat_date)
    DO UPDATE SET clicks = ad_stats.clicks + 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 실행 권한 추가 (프론트엔드 통계 수집용)
GRANT EXECUTE ON FUNCTION track_ad_event(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION track_ad_event(UUID, TEXT) TO authenticated;

-- Storage Bucket for Ads
INSERT INTO storage.buckets (id, name, public) VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Ads
CREATE POLICY "Public Access Ads" ON storage.objects FOR SELECT USING ( bucket_id = 'ads' );

CREATE POLICY "Admins can upload ads" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'ads' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Admins can update ads" ON storage.objects FOR UPDATE USING (
    bucket_id = 'ads' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Admins can delete ads" ON storage.objects FOR DELETE USING (
    bucket_id = 'ads' 
    AND auth.role() = 'authenticated'
);

-- RLS 설정
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_stats ENABLE ROW LEVEL SECURITY;

-- 익명 사용자 조회 권한 (광고 노출용)
CREATE POLICY "Ads are viewable by everyone" ON ads
  FOR SELECT USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

-- 인증된 사용자(Admin) 모든 권한
CREATE POLICY "Admins can manage ads" ON ads
  FOR ALL USING (auth.role() = 'authenticated');

-- 통계 테이블은 RPC를 통해서만 업데이트하도록 하고 조회만 Admin에게 허용
CREATE POLICY "Admins can view stats" ON ad_stats
  FOR SELECT USING (auth.role() = 'authenticated');
