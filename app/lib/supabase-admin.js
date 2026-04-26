import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin client — bypasses RLS.
 * ONLY use on the server (API routes, webhooks, server actions).
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
