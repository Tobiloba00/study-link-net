-- ════════════════════════════════════════════════════════════
-- Admin-only RPC: surface a user's auth.* fields (phone, providers,
-- last_sign_in_at, etc.) to the admin dashboard.
--
-- Why a SECURITY DEFINER RPC: the auth.users table is owned by the
-- Supabase auth role and isn't readable by the anon / authenticated
-- roles. A SECURITY DEFINER function (owned by postgres) can read it,
-- and we gate access with a has_role('admin') check so non-admins
-- can't enumerate emails or phones.
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.admin_get_user_details(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_result jsonb;
BEGIN
  IF NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

  SELECT jsonb_build_object(
    'id',                  u.id,
    'email',               u.email,
    'phone',               u.phone,
    'email_confirmed_at',  u.email_confirmed_at,
    'phone_confirmed_at',  u.phone_confirmed_at,
    'last_sign_in_at',     u.last_sign_in_at,
    'created_at',          u.created_at,
    'updated_at',          u.updated_at,
    -- raw_app_meta_data.providers is an array; raw_app_meta_data.provider is the primary
    'providers',           COALESCE(u.raw_app_meta_data->'providers', '[]'::jsonb),
    'provider',            u.raw_app_meta_data->>'provider',
    'banned_until',        u.banned_until,
    'role',                u.role
  )
  INTO v_result
  FROM auth.users u
  WHERE u.id = p_user_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_details(UUID) TO authenticated;
