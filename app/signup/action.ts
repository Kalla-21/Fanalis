"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signupUser(formData: FormData) {
  console.log("--- SIGNUP ACTION TRIGGERED ---");
  //get data from signup form
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

  const cookieStore = await cookies();

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
          } catch (error) {}
        },
      },
    }
  );

  // input data into Supabase Auth users
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    redirect('/signup?error=' + encodeURIComponent(error.message));
  }

  // insert data into profile table in supabase db
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username: username,
      });

    // error code in url
    if (profileError) {
      console.error("PROFILE DB ERROR:", profileError);
      redirect('/signup?error=' + encodeURIComponent("DB_ERROR: " + profileError.message));
    }
  }

  // success msg in url, redirect to login
  redirect('/login?message=Account created successfully');
}