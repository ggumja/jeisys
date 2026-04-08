-- Create Test User in Supabase
-- This script creates a test user with email: test@test.com, password: 1234

-- Note: In Supabase, you cannot directly insert into auth.users with a plain password.
-- You have two options:

-- OPTION 1: Use Supabase Dashboard (Recommended)
-- 1. Go to: https://supabase.com/dashboard/project/xbtnhnkwlioufpyeuyyg/auth/users
-- 2. Click "Add user" → "Create new user"
-- 3. Enter:
--    - Email: test@test.com
--    - Password: 1234
--    - Auto Confirm User: YES (check this box)
-- 4. Click "Create user"

-- OPTION 2: Use SQL with encrypted password (Advanced)
-- First, you need to generate a bcrypt hash for "1234"
-- You can use: https://bcrypt-generator.com/ with 10 rounds
-- Bcrypt hash for "1234": $2a$10$YourHashHere

-- Then run this SQL (replace the hash):
/*
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@test.com',
    crypt('1234', gen_salt('bf')), -- This requires pgcrypto extension
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    ''
);
*/

-- OPTION 3: Enable pgcrypto and create user (Easiest SQL method)
-- Run these commands in order:

-- 1. Enable pgcrypto extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create the auth user
DO $$
DECLARE
    new_user_id uuid;
BEGIN
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
        'test@test.com',
        crypt('1234', gen_salt('bf')),
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
    RETURNING id INTO new_user_id;

    -- Insert into public.users (your custom user table)
    INSERT INTO public.users (
        id,
        email,
        name,
        hospital_name,
        role,
        approval_status,
        created_at,
        updated_at
    )
    VALUES (
        new_user_id,
        'test@test.com',
        'Test User',
        'Test Hospital',
        'user',
        'APPROVED',
        NOW(),
        NOW()
    );

    RAISE NOTICE 'User created successfully with ID: %', new_user_id;
END $$;

-- Verify the user was created
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'test@test.com';

SELECT id, email, name, hospital_name, role, approval_status 
FROM public.users 
WHERE email = 'test@test.com';
