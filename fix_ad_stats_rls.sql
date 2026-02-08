-- 광고 통계 테이블 RLS 및 권한 수정
-- track_ad_event RPC 함수가 정상적으로 작동하도록 RLS 정책을 추가합니다.

-- 1. 기존 정책 정리
DROP POLICY IF EXISTS "Admins can view stats" ON ad_stats;
DROP POLICY IF EXISTS "Anyone can insert stats" ON ad_stats;
DROP POLICY IF EXISTS "Anyone can update stats" ON ad_stats;

-- 2. 테이블 권한 부여 (RPC 내부에서 작동하기 위해 필요)
GRANT INSERT, UPDATE, SELECT ON TABLE ad_stats TO anon, authenticated;

-- 3. 조회 권한 (인증된 사용자/관리자)
CREATE POLICY "Admins can view stats" ON ad_stats
  FOR SELECT TO authenticated USING (true);

-- 4. 삽입 권한 (익명 사용자 포함 - 통계 수집용)
-- 보안을 위해 INSERT는 가능하게 하되, SELECT는 제한적입니다.
CREATE POLICY "Anyone can insert stats" ON ad_stats
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 5. 업데이트 권한 (익명 사용자 포함 - 통계 수집용)
CREATE POLICY "Anyone can update stats" ON ad_stats
  FOR UPDATE TO anon, authenticated USING (true);

-- 6. RPC 함수 권한 재확인
GRANT EXECUTE ON FUNCTION track_ad_event(UUID, TEXT) TO anon, authenticated;

-- 7. 함수 정의 수정 (보안 및 경로 명시)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
