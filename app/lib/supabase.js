import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for Client Components.
 * Uses browser cookies for session management.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Legacy export for backward compatibility with existing code
// that imports `supabase` directly
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);
