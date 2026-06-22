-- P0 security: RLS billing protection, RPC lockdown, atomic spend/refund.

-- ========== 1. Block client updates to billing columns ==========
DROP POLICY IF EXISTS "profiles_update_own" ON public.users_profiles;

CREATE OR REPLACE FUNCTION public.protect_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Service role (API) and SECURITY DEFINER functions may update billing fields.
  IF coalesce(auth.jwt() ->> 'role', '') = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.credits_balance IS DISTINCT FROM OLD.credits_balance
     OR NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    RAISE EXCEPTION 'billing columns are server-only'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_users_profiles_billing ON public.users_profiles;
CREATE TRIGGER protect_users_profiles_billing
BEFORE UPDATE ON public.users_profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_billing_columns();

-- ========== 2. Lock down grant_purchase_credits ==========
REVOKE ALL ON FUNCTION public.grant_purchase_credits(uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_purchase_credits(uuid, integer, text) FROM anon;
REVOKE ALL ON FUNCTION public.grant_purchase_credits(uuid, integer, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.grant_purchase_credits(uuid, integer, text) TO service_role;

-- ========== 3. Atomic credit spend ==========
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id uuid,
  p_amount integer,
  p_ref_key text,
  p_feature text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_feature text;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID');
  END IF;

  IF p_ref_key IS NULL OR length(trim(p_ref_key)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID');
  END IF;

  IF p_feature IS NOT NULL AND p_feature NOT IN ('enhance', 'video') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID');
  END IF;

  v_feature := CASE WHEN p_feature IN ('enhance', 'video') THEN p_feature ELSE NULL END;

  IF EXISTS (
    SELECT 1
    FROM public.transactions
    WHERE lemonsqueezy_order_id = p_ref_key
  ) THEN
    SELECT credits_balance INTO v_balance
    FROM public.users_profiles
    WHERE id = p_user_id;

    IF v_balance IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'NO_PROFILE');
    END IF;

    RETURN jsonb_build_object(
      'ok', true,
      'credits_spent', 0,
      'balance_after', v_balance,
      'already_charged', true
    );
  END IF;

  UPDATE public.users_profiles
  SET credits_balance = credits_balance - p_amount
  WHERE id = p_user_id
    AND credits_balance >= p_amount
  RETURNING credits_balance INTO v_balance;

  IF NOT FOUND THEN
    IF NOT EXISTS (SELECT 1 FROM public.users_profiles WHERE id = p_user_id) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'NO_PROFILE');
    END IF;

    SELECT credits_balance INTO v_balance
    FROM public.users_profiles
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'ok', false,
      'error', 'INSUFFICIENT_CREDITS',
      'balance', coalesce(v_balance, 0)
    );
  END IF;

  INSERT INTO public.transactions (
    user_id,
    type,
    credits_amount,
    lemonsqueezy_order_id,
    feature_used
  )
  VALUES (p_user_id, 'usage', -p_amount, p_ref_key, v_feature);

  RETURN jsonb_build_object(
    'ok', true,
    'credits_spent', p_amount,
    'balance_after', v_balance,
    'already_charged', false
  );
EXCEPTION
  WHEN unique_violation THEN
    SELECT credits_balance INTO v_balance
    FROM public.users_profiles
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'ok', true,
      'credits_spent', 0,
      'balance_after', coalesce(v_balance, 0),
      'already_charged', true
    );
END;
$$;

REVOKE ALL ON FUNCTION public.spend_credits(uuid, integer, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.spend_credits(uuid, integer, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.spend_credits(uuid, integer, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, integer, text, text) TO service_role;

-- ========== 4. Refund a prior spend (Atlas failure) ==========
CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id uuid,
  p_ref_key text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage public.transactions%ROWTYPE;
  v_refund_key text;
  v_balance integer;
BEGIN
  IF p_ref_key IS NULL OR length(trim(p_ref_key)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID');
  END IF;

  v_refund_key := 'refund:' || p_ref_key;

  IF EXISTS (
    SELECT 1
    FROM public.transactions
    WHERE lemonsqueezy_order_id = v_refund_key
  ) THEN
    RETURN jsonb_build_object('ok', true, 'already_refunded', true);
  END IF;

  SELECT *
  INTO v_usage
  FROM public.transactions
  WHERE user_id = p_user_id
    AND lemonsqueezy_order_id = p_ref_key
    AND type = 'usage'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  END IF;

  IF v_usage.credits_amount >= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_USAGE');
  END IF;

  INSERT INTO public.transactions (
    user_id,
    type,
    credits_amount,
    lemonsqueezy_order_id,
    feature_used
  )
  VALUES (
    p_user_id,
    'purchase',
    abs(v_usage.credits_amount),
    v_refund_key,
    v_usage.feature_used
  );

  UPDATE public.users_profiles
  SET credits_balance = credits_balance + abs(v_usage.credits_amount)
  WHERE id = p_user_id
  RETURNING credits_balance INTO v_balance;

  RETURN jsonb_build_object(
    'ok', true,
    'refunded', abs(v_usage.credits_amount),
    'balance_after', v_balance
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', true, 'already_refunded', true);
END;
$$;

REVOKE ALL ON FUNCTION public.refund_credits(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_credits(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.refund_credits(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, text) TO service_role;

-- ========== 5. Finalize pending Atlas ref → atlas:{predictionId} ==========
CREATE OR REPLACE FUNCTION public.finalize_credit_ref(
  p_user_id uuid,
  p_pending_ref text,
  p_final_ref text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_pending_ref IS NULL OR length(trim(p_pending_ref)) = 0
     OR p_final_ref IS NULL OR length(trim(p_final_ref)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.transactions
    WHERE lemonsqueezy_order_id = p_final_ref
  ) THEN
    RETURN jsonb_build_object('ok', true, 'already_finalized', true);
  END IF;

  UPDATE public.transactions
  SET lemonsqueezy_order_id = p_final_ref
  WHERE user_id = p_user_id
    AND lemonsqueezy_order_id = p_pending_ref;

  IF NOT FOUND THEN
    IF EXISTS (
      SELECT 1
      FROM public.transactions
      WHERE user_id = p_user_id
        AND lemonsqueezy_order_id = p_final_ref
    ) THEN
      RETURN jsonb_build_object('ok', true, 'already_finalized', true);
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  END IF;

  RETURN jsonb_build_object('ok', true);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', true, 'already_finalized', true);
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_credit_ref(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_credit_ref(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.finalize_credit_ref(uuid, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_credit_ref(uuid, text, text) TO service_role;
