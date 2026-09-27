"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginUser(formData: FormData) {
  // get data from login form
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const cookieStore = await cookies();

  // init supabase client side
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(keysToSet) {
          try {
            keysToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // safe error caching since this is from server side
          }
        },
      },
    }
  );


  // i love supabase autochecker and start new session
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // back to login with reason
    redirect('/login?error=Invalid credentials');
  }

  // if correct login go back to main
  redirect('/');
}

