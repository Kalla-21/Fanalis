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

// Helper to delete an old file from Supabase storage given its public URL
async function deleteOldImage(supabase: any, publicUrl: string | null) {
  if (!publicUrl) return;
  try {
    // Check if it's a Supabase storage URL
    if (publicUrl.includes("fanalis-images")) {
      const parts = publicUrl.split("fanalis-images/");
      if (parts.length > 1) {
        const filePath = decodeURIComponent(parts[1]); // e.g. "covers/user-123.jpg"
        console.log("Attempting to delete path from storage:", filePath);
        
        const { error } = await supabase.storage.from('fanalis-images').remove([filePath]);
        if (error) {
          console.error("Supabase Storage Delete Error:", error.message);
        } else {
          console.log("Successfully deleted old file from bucket:", filePath);
        }
      }
    }
  } catch (err) {
    console.error("Failed to delete old image from storage:", err);
  }
}

async function uploadImage(supabase: any, userId: string, file: File, folder: string) {
  if (!file || file.size === 0) return null;
  
  // Reject GIFs server-side
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

export async function updateCoverPhoto(formData: FormData) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  // Fetch current profile to check if there's an old cover photo we should delete
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("cover_photo_url")
    .eq("id", user.id)
    .single();

  const coverFile = formData.get("cover_file") as File;
  const coverPosition = formData.get("cover_position") as string || "50";

  try {
    const updates: any = { cover_position: parseInt(coverPosition) };
    
    if (coverFile && coverFile.size > 0) {
      // Upload new image first
      updates.cover_photo_url = await uploadImage(supabase, user.id, coverFile, 'covers');
      
      // FIRE AND FORGET: Removed 'await' so UI doesn't block on deletion
      if (currentProfile?.cover_photo_url) {
        deleteOldImage(supabase, currentProfile.cover_photo_url);
      }
    }

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) return { error: error.message };
    
    revalidatePath("/", "layout");
    return { success: "Cover photo updated!" };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function resetCoverPhoto() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  // Get current profile so we know which file to delete from storage
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("cover_photo_url")
    .eq("id", user.id)
    .single();

  // FIRE AND FORGET: Removed 'await'
  if (currentProfile?.cover_photo_url) {
    deleteOldImage(supabase, currentProfile.cover_photo_url);
  }

  const { error } = await supabase.from("profiles").update({ cover_photo_url: null, cover_position: 50 }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: "Cover photo reset to default." };
}

export async function updateAvatarPhoto(formData: FormData) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  const avatarFile = formData.get("avatar_file") as File;
  if (!avatarFile || avatarFile.size === 0) return { error: "No file selected." };

  try {
    const avatar_url = await uploadImage(supabase, user.id, avatarFile, 'avatars');
    
    // FIRE AND FORGET: Removed 'await'
    if (currentProfile?.avatar_url) {
      deleteOldImage(supabase, currentProfile.avatar_url);
    }

    const { error } = await supabase.from("profiles").update({ avatar_url }).eq("id", user.id);
    if (error) return { error: error.message };
    
    revalidatePath("/", "layout");
    return { success: "Avatar updated!" };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function resetAvatarPhoto() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  // FIRE AND FORGET: Removed 'await'
  if (currentProfile?.avatar_url) {
    deleteOldImage(supabase, currentProfile.avatar_url);
  }

  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: "Avatar reset to default." };
}

export async function updateProfileInfo(formData: FormData) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const username = formData.get("username") as string;
  const bio = formData.get("bio") as string;

  const { error } = await supabase.from("profiles").update({ username, bio }).eq("id", user.id);
  if (error) return { error: error.message };
  
  revalidatePath("/", "layout");
  return { success: "Profile info updated!" };
}

export async function updatePassword(formData: FormData) {
  const supabase = await getSupabase();
  const newPassword = formData.get("new_password") as string;
  if (!newPassword) return { error: "Password cannot be empty." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: "Password updated successfully." };
}

export async function updateEmail(formData: FormData) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const newEmail = formData.get("new_email") as string;
  if (!newEmail) return { error: "Email cannot be empty." };
  if (newEmail === user?.email) return { error: "New email is the same as your current email." };

  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) return { error: error.message };
  return { success: "Confirmation link sent to your new email." };
}