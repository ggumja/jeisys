-- 테스트용 회원 및 등급 데이터 생성 스크립트 (auth.users 포함)
-- 이 스크립트는 20명의 테스트 회원을 생성하고, 각 등급별(VIP, Gold, Silver, Bronze)로 매출 데이터를 할당합니다.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    i integer;
    email_val varchar;
    total_sales bigint;
    new_user_id uuid;
BEGIN
    -- 1. 기존 테스트 데이터 삭제
    -- public.orders 삭제 (user_id 조인하여 테스트 패턴 회원만 삭제)
    DELETE FROM public.orders WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE 'test%@jeisys.com');
    -- public.users 삭제
    DELETE FROM public.users WHERE email LIKE 'test%@jeisys.com';
    -- auth.users 삭제
    DELETE FROM auth.users WHERE email LIKE 'test%@jeisys.com';

    FOR i IN 1..20 LOOP
        email_val := 'test' || LPAD(i::text, 2, '0') || '@jeisys.com';
        new_user_id := gen_random_uuid();
        
        -- 2. auth.users 삽입 (로그인 가능하도록)
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            confirmation_sent_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            email_val,
            crypt('1234', gen_salt('bf')), -- 모든 테스트 계정 비밀번호: 1234
            NOW(),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            FALSE,
            ''
        );

        -- 3. public.users 삽입
        INSERT INTO public.users (
            id,
            email, 
            name, 
            hospital_name, 
            approval_status, 
            role,
            hospital_email,
            phone,
            mobile,
            business_number,
            created_at,
            updated_at
        )
        VALUES (
            new_user_id,
            email_val, 
            '테스트유저' || LPAD(i::text, 2, '0'), 
            '테스트병원' || LPAD(i::text, 2, '0'), 
            'APPROVED', 
            'user',
            email_val,
            '02-1234-5678',
            '010-1234-5678',
            '123-45-' || LPAD(i::text, 5, '0'),
            NOW(),
            NOW()
        );
        
        -- 4. 등급별 매출액 결정
        -- 1-5: VIP (5천만 이상)
        -- 6-10: Gold (3천만 이상)
        -- 11-15: Silver (1천만 이상)
        -- 16-20: Bronze (1천만 미만)
        IF i <= 5 THEN
            total_sales := 55000000;
        ELSIF i <= 10 THEN
            total_sales := 35000000;
        ELSIF i <= 15 THEN
            total_sales := 15000000;
        ELSE
            total_sales := 5000000;
        END IF;
        
        -- 5. 주문 데이터 삽입 (매출 집계를 위함)
        INSERT INTO public.orders (
            user_id, 
            order_number, 
            total_amount, 
            status, 
            ordered_at,
            delivery_address
        )
        VALUES (
            new_user_id, 
            'TEST-ORDER-' || LPAD(i::text, 2, '0'), 
            total_sales, 
            'paid', 
            now(),
            '서울특별시 강남구 테헤란로 123'
        );
        
    END LOOP;
END $$;
