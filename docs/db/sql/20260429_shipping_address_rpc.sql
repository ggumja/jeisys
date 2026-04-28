-- ============================================================
-- 배송지 관련 RPC 함수 생성
-- PATCH CORS 문제 우회 - REST API update → RPC(POST) 전환
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 작성일: 2026-04-29
-- ============================================================

-- 1. 기본배송지 전체 해제 (addAddress 전처리용)
CREATE OR REPLACE FUNCTION public.clear_default_shipping_addresses()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE shipping_addresses SET is_default = false WHERE user_id = auth.uid();
END;
$$;

-- 2. 배송지 수정 (기본배송지 설정 포함)
CREATE OR REPLACE FUNCTION public.update_shipping_address(
  p_id UUID,
  p_label TEXT DEFAULT NULL,
  p_recipient TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_zip_code TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_address_detail TEXT DEFAULT NULL,
  p_is_default BOOLEAN DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_is_default = true THEN
    UPDATE shipping_addresses SET is_default = false WHERE user_id = auth.uid();
  END IF;
  UPDATE shipping_addresses SET
    label          = COALESCE(p_label, label),
    recipient      = COALESCE(p_recipient, recipient),
    phone          = COALESCE(p_phone, phone),
    zip_code       = COALESCE(p_zip_code, zip_code),
    address        = COALESCE(p_address, address),
    address_detail = COALESCE(p_address_detail, address_detail),
    is_default     = COALESCE(p_is_default, is_default),
    updated_at     = NOW()
  WHERE id = p_id AND user_id = auth.uid();
END;
$$;

-- 3. 기본배송지 변경
CREATE OR REPLACE FUNCTION public.set_default_shipping_address(p_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE shipping_addresses SET is_default = false WHERE user_id = auth.uid();
  UPDATE shipping_addresses SET is_default = true  WHERE id = p_id AND user_id = auth.uid();
END;
$$;
