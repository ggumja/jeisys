-- ============================================
-- Insert Sample Data for Jeisys Medical B2B
-- ============================================
-- Run this AFTER supabase_complete_setup.sql
-- ============================================

-- ============================================
-- 1. EQUIPMENTS (장비 마스터 데이터)
-- ============================================
INSERT INTO public.equipments (model_name, code, category, image_url) VALUES
('ULTRAcel Q+', 'ULTRACEL', 'HIFU 장비', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400'),
('POTENZA', 'POTENZA', 'RF 마이크로니들', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400'),
('INTRAcel', 'INTRACEL', 'RF 니들 장비', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400'),
('LINEARZ', 'LINEARZ', '레이저 장비', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400'),
('LINEARZ PLUS', 'LINEARZ_PLUS', '레이저 장비', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. PRODUCTS (소모품 데이터)
-- ============================================

-- Density 카테고리 (ULTRAcel Q+ 전용)
INSERT INTO public.products (sku, name, category, subcategory, description, price, stock, image_url, is_active) VALUES
('CART-ULTRA-1.5MM', 'ULTRAcel 카트리지 1.5mm', 'Density', '클래식팁 프로모션', 'ULTRAcel 전용 1.5mm 카트리지. 표피층 타겟팅', 85000, 25, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', true),
('CART-ULTRA-3.0MM', 'ULTRAcel 카트리지 3.0mm', 'Density', '하이팁 프로모션', 'ULTRAcel 전용 3.0mm 카트리지. 진피층 타겟팅', 88000, 30, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', true),
('CART-ULTRA-4.5MM', 'ULTRAcel 카트리지 4.5mm', 'Density', '클래식/하이 페이스팁 300샷 프로모션', 'ULTRAcel 전용 4.5mm 카트리지. SMAS층 리프팅', 92000, 28, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', true),

-- DLiv 카테고리
('DLIV-INJECTOR-20', 'DLiv 전용 인젝터 20 SET', 'DLiv', null, 'DLiv 전용 인젝터 20개 세트. 주사기 및 각종 부속품 포함', 198000, 40, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', true),
('DLIV-PUMPING-16', 'DLiv 전용 PUMPING 16 팁 10SET', 'DLiv', null, 'DLiv PUMPING-16 10개 세트. 펌핑 헤드 및 주사기 포함', 250000, 35, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', true),
('DLIV-PUMPING-25', 'DLiv 전용 PUMPING 25 팁 10SET', 'DLiv', null, 'DLiv PUMPING-25 10개 세트. 대용량 펌핑 헤드 및 주사기 포함', 250000, 30, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', true),

-- POTENZA 카테고리
('PTZ-DIAMOND', 'POTENZA Diamond tip', 'POTENZA', null, '한샷에 모노폴라와 바이폴라, 교차 조사 • 6mm 깊이까지 에너지 도달 가능 • Monopola + Bipolar • 전극수: 16 EA(4X4)', 95000, 30, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', true),
('PTZ-DDR', 'POTENZA DDR tip', 'POTENZA', null, 'Multiple pulse를 이용한 Dermal Heating • 2.5mm 깊이까지 에너지 도달 가능 • Bipolar / 2MHz • 전극수: 36 EA(6X6)', 88000, 35, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', true),
('PTZ-SFA', 'POTENZA SFA tip', 'POTENZA', null, 'Single pulse를 이용한 Dermal Heating • 4mm 깊이까지 에너지 도달 가능 • Monopolar / 1MHz • 전극수: 25 EA(5X5)', 92000, 32, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', true),

-- INTRAcel 카테고리
('INTRA-NEEDLE-25', 'INTRAcel 니들 25개입', 'INTRAcel', null, 'INTRAcel 전용 니들 25개 세트', 120000, 20, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', true),
('INTRA-NEEDLE-49', 'INTRAcel 니들 49개입', 'INTRAcel', null, 'INTRAcel 전용 니들 49개 세트 (고밀도)', 145000, 18, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', true),

-- LINEARZ 카테고리
('LNZ-HANDPIECE-532', 'LINEARZ 핸드피스 532nm', 'LINEARZ', null, 'LINEARZ 전용 532nm 핸드피스. 색소 치료용', 280000, 15, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', true),
('LNZ-HANDPIECE-1064', 'LINEARZ 핸드피스 1064nm', 'LINEARZ', null, 'LINEARZ 전용 1064nm 핸드피스. 깊은 색소 치료용', 320000, 12, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', true)
ON CONFLICT (sku) DO NOTHING;

-- ============================================
-- 3. PRODUCT COMPATIBILITY (제품-장비 호환성)
-- ============================================

-- Get equipment IDs
DO $$
DECLARE
    ultracel_id UUID;
    potenza_id UUID;
    intracel_id UUID;
    linearz_id UUID;
    
    ultra_15mm_id UUID;
    ultra_30mm_id UUID;
    ultra_45mm_id UUID;
    ptz_diamond_id UUID;
    ptz_ddr_id UUID;
    ptz_sfa_id UUID;
    intra_25_id UUID;
    intra_49_id UUID;
    lnz_532_id UUID;
    lnz_1064_id UUID;
BEGIN
    -- Get equipment IDs
    SELECT id INTO ultracel_id FROM public.equipments WHERE code = 'ULTRACEL';
    SELECT id INTO potenza_id FROM public.equipments WHERE code = 'POTENZA';
    SELECT id INTO intracel_id FROM public.equipments WHERE code = 'INTRACEL';
    SELECT id INTO linearz_id FROM public.equipments WHERE code = 'LINEARZ';
    
    -- Get product IDs
    SELECT id INTO ultra_15mm_id FROM public.products WHERE sku = 'CART-ULTRA-1.5MM';
    SELECT id INTO ultra_30mm_id FROM public.products WHERE sku = 'CART-ULTRA-3.0MM';
    SELECT id INTO ultra_45mm_id FROM public.products WHERE sku = 'CART-ULTRA-4.5MM';
    SELECT id INTO ptz_diamond_id FROM public.products WHERE sku = 'PTZ-DIAMOND';
    SELECT id INTO ptz_ddr_id FROM public.products WHERE sku = 'PTZ-DDR';
    SELECT id INTO ptz_sfa_id FROM public.products WHERE sku = 'PTZ-SFA';
    SELECT id INTO intra_25_id FROM public.products WHERE sku = 'INTRA-NEEDLE-25';
    SELECT id INTO intra_49_id FROM public.products WHERE sku = 'INTRA-NEEDLE-49';
    SELECT id INTO lnz_532_id FROM public.products WHERE sku = 'LNZ-HANDPIECE-532';
    SELECT id INTO lnz_1064_id FROM public.products WHERE sku = 'LNZ-HANDPIECE-1064';
    
    -- Insert compatibility mappings
    -- ULTRAcel products
    INSERT INTO public.product_compatibility (product_id, equipment_id) VALUES
    (ultra_15mm_id, ultracel_id),
    (ultra_30mm_id, ultracel_id),
    (ultra_45mm_id, ultracel_id)
    ON CONFLICT DO NOTHING;
    
    -- POTENZA products
    INSERT INTO public.product_compatibility (product_id, equipment_id) VALUES
    (ptz_diamond_id, potenza_id),
    (ptz_ddr_id, potenza_id),
    (ptz_sfa_id, potenza_id)
    ON CONFLICT DO NOTHING;
    
    -- INTRAcel products
    INSERT INTO public.product_compatibility (product_id, equipment_id) VALUES
    (intra_25_id, intracel_id),
    (intra_49_id, intracel_id)
    ON CONFLICT DO NOTHING;
    
    -- LINEARZ products
    INSERT INTO public.product_compatibility (product_id, equipment_id) VALUES
    (lnz_532_id, linearz_id),
    (lnz_1064_id, linearz_id)
    ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- 4. PRODUCT PRICING TIERS (수량별 가격)
-- ============================================

DO $$
DECLARE
    product_record RECORD;
BEGIN
    -- ULTRAcel 카트리지 가격 정책
    FOR product_record IN 
        SELECT id FROM public.products WHERE sku LIKE 'CART-ULTRA-%'
    LOOP
        INSERT INTO public.product_pricing_tiers (product_id, min_quantity, unit_price) VALUES
        (product_record.id, 1, (SELECT price FROM public.products WHERE id = product_record.id)),
        (product_record.id, 3, (SELECT price FROM public.products WHERE id = product_record.id) - 3000),
        (product_record.id, 5, (SELECT price FROM public.products WHERE id = product_record.id) - 5000)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- POTENZA 팁 가격 정책
    FOR product_record IN 
        SELECT id FROM public.products WHERE sku LIKE 'PTZ-%'
    LOOP
        INSERT INTO public.product_pricing_tiers (product_id, min_quantity, unit_price) VALUES
        (product_record.id, 1, (SELECT price FROM public.products WHERE id = product_record.id)),
        (product_record.id, 5, (SELECT price FROM public.products WHERE id = product_record.id) - 3000),
        (product_record.id, 10, (SELECT price FROM public.products WHERE id = product_record.id) - 5000)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- DLiv 제품 가격 정책
    FOR product_record IN 
        SELECT id FROM public.products WHERE sku LIKE 'DLIV-%'
    LOOP
        INSERT INTO public.product_pricing_tiers (product_id, min_quantity, unit_price) VALUES
        (product_record.id, 1, (SELECT price FROM public.products WHERE id = product_record.id)),
        (product_record.id, 5, (SELECT price FROM public.products WHERE id = product_record.id) - 3000),
        (product_record.id, 10, (SELECT price FROM public.products WHERE id = product_record.id) - 8000)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- ============================================
-- 5. SAMPLE POSTS (공지사항, FAQ 등)
-- ============================================

INSERT INTO public.posts (type, title, content, is_visible, view_count) VALUES
('notice', '2024년 설 연휴 배송 안내', '설 연휴 기간(2024.02.09~02.12) 동안 주문하신 제품은 2월 13일부터 순차 배송됩니다.', true, 45),
('notice', '신제품 출시 안내 - POTENZA Diamond Tip', 'POTENZA의 신제품 Diamond Tip이 출시되었습니다. 기존 대비 20% 향상된 효율을 자랑합니다.', true, 128),
('faq', '배송은 얼마나 걸리나요?', '주문 확인 후 영업일 기준 2-3일 내 배송됩니다. 도서산간 지역은 1-2일 추가 소요될 수 있습니다.', true, 234),
('faq', '반품/교환은 어떻게 하나요?', '제품 수령 후 7일 이내 미개봉 상태에 한해 반품/교환이 가능합니다. 고객센터로 문의 주세요.', true, 156),
('news', '제이시스메디컬, 2024 K-뷰티 엑스포 참가', '제이시스메디컬이 2024년 K-뷰티 엑스포에 참가하여 신제품을 선보입니다.', true, 89),
('media', '제품 사용 가이드 영상 업데이트', 'ULTRAcel Q+ 제품의 상세 사용 가이드 영상이 업데이트되었습니다.', true, 312)
ON CONFLICT DO NOTHING;

-- ============================================
-- SETUP COMPLETE
-- ============================================
SELECT 'Sample data inserted successfully!' AS status;

-- Verify data
SELECT 'Equipments:', COUNT(*) FROM public.equipments;
SELECT 'Products:', COUNT(*) FROM public.products;
SELECT 'Product Compatibility:', COUNT(*) FROM public.product_compatibility;
SELECT 'Pricing Tiers:', COUNT(*) FROM public.product_pricing_tiers;
SELECT 'Posts:', COUNT(*) FROM public.posts;
