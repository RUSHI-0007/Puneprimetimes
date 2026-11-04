import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    // Return dummy or console error if missing during build
    if (typeof window !== 'undefined') {
      console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
    }
  }

  return createBrowserClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-anon-key');
}

