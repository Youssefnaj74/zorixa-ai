import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

export const supabaseAdmin = createClient(env.supabase.url, env.required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false }
});

