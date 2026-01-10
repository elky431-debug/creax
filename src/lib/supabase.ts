import { createClient } from "@supabase/supabase-js";

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }
  if (!supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

let _client: ReturnType<typeof createSupabaseClient> | null = null;

function getSupabaseClient() {
  if (_client) return _client;
  _client = createSupabaseClient();
  return _client;
}

/**
 * Lazy Supabase client.
 * - Avoids throwing at module import time (keeps Next.js build stable)
 * - Still throws a clear error the moment you actually use it if env vars are missing
 */
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_target, prop) {
    const client = getSupabaseClient() as any;
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  }
});















