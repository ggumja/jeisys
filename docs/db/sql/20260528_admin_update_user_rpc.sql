-- ============================================================
-- 관리자용 사용자 정보 수정 RPC
-- PATCH(CORS) 오류 우회를 위해 POST 방식으로 호출하기 위한 함수
-- 작성일: 2026-05-28
-- ============================================================

CREATE OR REPLACE FUNCTION admin_update_user_fields(p_user_id uuid, p_update_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. 관리자 권한 확인 (check_is_admin 함수 사용)
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Only administrators can perform this action';
  END IF;

  -- 2. JSONB 데이터를 파싱하여 users 테이블 업데이트
  -- ? 연산자를 통해 해당 키가 payload에 포함되어 있을 때만 덮어씁니다.
  UPDATE users
  SET 
    name = CASE WHEN p_update_data ? 'name' THEN p_update_data->>'name' ELSE name END,
    hospital_name = CASE WHEN p_update_data ? 'hospital_name' THEN p_update_data->>'hospital_name' ELSE hospital_name END,
    business_number = CASE WHEN p_update_data ? 'business_number' THEN p_update_data->>'business_number' ELSE business_number END,
    phone = CASE WHEN p_update_data ? 'phone' THEN p_update_data->>'phone' ELSE phone END,
    mobile = CASE WHEN p_update_data ? 'mobile' THEN p_update_data->>'mobile' ELSE mobile END,
    zip_code = CASE WHEN p_update_data ? 'zip_code' THEN p_update_data->>'zip_code' ELSE zip_code END,
    address = CASE WHEN p_update_data ? 'address' THEN p_update_data->>'address' ELSE address END,
    address_detail = CASE WHEN p_update_data ? 'address_detail' THEN p_update_data->>'address_detail' ELSE address_detail END,
    region = CASE WHEN p_update_data ? 'region' THEN p_update_data->>'region' ELSE region END,
    member_type = CASE WHEN p_update_data ? 'member_type' THEN p_update_data->>'member_type' ELSE member_type END,
    hospital_email = CASE WHEN p_update_data ? 'hospital_email' THEN p_update_data->>'hospital_email' ELSE hospital_email END,
    tax_email = CASE WHEN p_update_data ? 'tax_email' THEN p_update_data->>'tax_email' ELSE tax_email END,
    approval_status = CASE WHEN p_update_data ? 'approval_status' THEN p_update_data->>'approval_status' ELSE approval_status END,
    role = CASE WHEN p_update_data ? 'role' THEN p_update_data->>'role' ELSE role END,
    admin_role = CASE WHEN p_update_data ? 'admin_role' THEN p_update_data->>'admin_role' ELSE admin_role END,
    permissions = CASE 
                    WHEN p_update_data ? 'permissions' THEN 
                        ARRAY(SELECT jsonb_array_elements_text(p_update_data->'permissions'))
                    ELSE permissions 
                  END,
    delivery_addresses = CASE WHEN p_update_data ? 'delivery_addresses' THEN p_update_data->'delivery_addresses' ELSE delivery_addresses END
  WHERE id = p_user_id;

END;
$$;
