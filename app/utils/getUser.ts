import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getUserProfile() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
      }
    }
  );

  // get auth session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { user: null, profile: null };
  }

  // get data from profile table
  const { data: profile } = await supabase
    .from('profiles')
    .select('*') // get all of profile table for profile tab mostly
    .eq('id', user.id)
    .single();

  return { user, profile };
}