-- ============================================
-- Create Admin User for Jeisys Medical B2B
-- ============================================
-- This script creates an admin user account
-- Email: admin@jeisys.com
-- Password: admin1234
-- ============================================

-- Enable pgcrypto extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin user
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if admin user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@jeisys.com') THEN
        RAISE NOTICE 'Admin user already exists!';
        RETURN;
    END IF;

    -- Insert into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        recovery_sent_at,
        email_change_sent_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@jeisys.com',
        crypt('admin1234', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        FALSE,
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO admin_user_id;

    -- Insert into public.users with admin role
    INSERT INTO public.users (
        id,
        email,
        name,
        hospital_name,
        phone,
        mobile,
        role,
        approval_status,
        created_at,
        updated_at
    )
    VALUES (
        admin_user_id,
        'admin@jeisys.com',
        '관리자',
        '제이시스메디컬 본사',
        '02-1234-5678',
        '010-1234-5678',
        'admin',
        'APPROVED',
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Admin user created successfully!';
    RAISE NOTICE 'Email: admin@jeisys.com';
    RAISE NOTICE 'Password: admin1234';
    RAISE NOTICE 'User ID: %', admin_user_id;
END $$;

-- Verify admin user was created
SELECT 
    u.id,
    u.email,
    u.name,
    u.hospital_name,
    u.role,
    u.approval_status,
    u.created_at
FROM public.users u
WHERE u.email = 'admin@jeisys.com';

-- ============================================
-- Admin Account Information
-- ============================================
-- Email: admin@jeisys.com
-- Password: admin1234
-- Role: admin
-- Status: APPROVED
-- ============================================
