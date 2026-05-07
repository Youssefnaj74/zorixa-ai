import { createClient } from "@supabase/supabase-js";

import { env, requirePublicSupabaseEnv } from "@/lib/env";

export const supabaseAdmin = createClient(requirePublicSupabaseEnv().url, env.required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false }
});

