import { createBrowserClient } from '@supabase/ssr';

let clientInstance = null;

/**
 * Create a Supabase client for Client Components.
 * Browser: Uses a singleton pattern to prevent multiple instances and storage lock contention.
 * Server: Returns a fresh instance (standard SSR behavior).
 */
export function createClient() {
  // If we are on the server, return a fresh client (standard for SSR)
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  // On the browser, ensure we only create the client once
  if (!clientInstance) {
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          // Explicit storage key to match the project ref and prevent lock interference
          storageKey: 'sb-oqdqcfllhpbnbyeampjc-auth-token',
        },
      }
    );
  }
  return clientInstance;
}

// Shared export used by cross-environment logic (e.g. api.js)
export const supabase = createClient();
