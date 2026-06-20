// Shared Supabase admin client for Vercel serverless functions.
// Uses the SERVICE ROLE key (server-only) so these functions can write
// orders/wallets/subscriptions regardless of RLS policies — this key must
// NEVER be exposed to the frontend. Set it in Vercel → Project → Settings →
// Environment Variables as SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://fycresqsgjqpfgvarxxq.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SERVICE_ROLE_KEY) {
  // Don't throw at import time (would crash every function cold start with a
  // confusing stack trace) — instead let callers surface a clear 500 with a
  // helpful message the admin can act on.
  console.warn("[api] SUPABASE_SERVICE_ROLE_KEY is not set — payment functions will fail.");
}

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export function requireServiceRole(): string | null {
  if (!SERVICE_ROLE_KEY) {
    return "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel → Settings → Environment Variables, then redeploy.";
  }
  return null;
}
