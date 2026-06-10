-- Safe billing hardening: dedupe payment refs, then UNIQUE index + grant RPC.
-- Run in Supabase SQL Editor (paste SQL only — not the file path).

-- ========== 1. BEFORE: duplicate payment references ==========
SELECT
  lemonsqueezy_order_id,
  COUNT(*) AS row_count,
  MIN(id) AS keep_id,
  ARRAY_AGG(id ORDER BY id) AS all_ids
FROM public.transactions
WHERE lemonsqueezy_order_id IS NOT NULL
GROUP BY lemonsqueezy_order_id
HAVING COUNT(*) > 1
ORDER BY lemonsqueezy_order_id;

-- ========== 2. CLEANUP: delete duplicates (keep oldest = lowest id) ==========
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY lemonsqueezy_order_id
      ORDER BY id ASC
    ) AS rn
  FROM public.transactions
  WHERE lemonsqueezy_order_id IS NOT NULL
),
to_delete AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM public.transactions t
USING to_delete d
WHERE t.id = d.id
RETURNING t.id, t.lemonsqueezy_order_id, t.credits_amount, t.created_at;

-- ========== 3. AFTER: should return zero rows ==========
SELECT
  lemonsqueezy_order_id,
  COUNT(*) AS row_count
FROM public.transactions
WHERE lemonsqueezy_order_id IS NOT NULL
GROUP BY lemonsqueezy_order_id
HAVING COUNT(*) > 1;

-- ========== 4. UNIQUE INDEX ==========
CREATE UNIQUE INDEX IF NOT EXISTS transactions_payment_ref_unique_idx
  ON public.transactions (lemonsqueezy_order_id)
  WHERE lemonsqueezy_order_id IS NOT NULL;

-- ========== 5. Atomic grant RPC ==========
CREATE OR REPLACE FUNCTION public.grant_purchase_credits(
  p_user_id uuid,
  p_credits integer,
  p_order_ref text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_credits IS NULL OR p_credits <= 0 THEN
    RETURN 'invalid';
  END IF;

  IF p_order_ref IS NULL OR length(trim(p_order_ref)) = 0 THEN
    RETURN 'invalid';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users_profiles WHERE id = p_user_id) THEN
    RETURN 'no_profile';
  END IF;

  INSERT INTO public.transactions (user_id, type, credits_amount, lemonsqueezy_order_id, feature_used)
  VALUES (p_user_id, 'purchase', p_credits, p_order_ref, NULL);

  UPDATE public.users_profiles
  SET credits_balance = credits_balance + p_credits
  WHERE id = p_user_id;

  RETURN 'granted';
EXCEPTION
  WHEN unique_violation THEN
    RETURN 'duplicate';
END;
$$;

-- ========== 6. VERIFY: index + function exist ==========
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'transactions'
  AND indexname = 'transactions_payment_ref_unique_idx';

SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'grant_purchase_credits';
