"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(keysToSet) {
          try { keysToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch (error) {}
        },
      },
    }
  );
}

export async function getAuthUser() {
  const supabase = await getSupabase();
  // getSession() is much more robust for cookie handling in server actions
  const { data: { session } } = await supabase.auth.getSession();
  
  return session?.user ? { id: session.user.id } : null;
}

async function uploadImage(supabase: any, userId: string, file: File, folder: string) {
  if (!file || file.size === 0) return null;
  
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (fileExt === 'gif' || file.type === 'image/gif') {
    throw new Error("GIF images are not permitted.");
  }

  if (file.size > 2 * 1024 * 1024) throw new Error("File must be under 2MB.");
  
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;
  
  const { error } = await supabase.storage.from('fanalis-images').upload(filePath, file);
  if (error) throw new Error(error.message);
  
  const { data } = supabase.storage.from('fanalis-images').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function createBlogPost(formData: FormData) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const coverFile = formData.get("cover_file") as File;

  if (!title || !description) {
    return { error: "Title and content are required." };
  }

  try {
    let imageUrl = null;
    
    // Upload image if provided
    if (coverFile && coverFile.size > 0) {
      imageUrl = await uploadImage(supabase, user.id, coverFile, 'posts');
    }

    // Insert post into database
    const { error } = await supabase.from("posts").insert({
      title,
      description,
      image_url: imageUrl,
      author_id: user.id,
    });

    if (error) throw new Error(error.message);

    revalidatePath("/");
    return { success: "Blog post published successfully!" };
  } catch (err: any) {
    return { error: err.message };
  }
}