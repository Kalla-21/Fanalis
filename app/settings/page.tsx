import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SettingsForm from "./settingsform";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="w-full min-h-[80vh] bg-[#1a1721] p-6 rounded-lg pt-12 pb-24 flex flex-col items-center">
      <div className="w-full max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-white mb-6 drop-shadow-md tracking-tight">account settings</h1>
        
        {/* If you have an outer wrapper div here around SettingsForm, 
            change its rounding to rounded-2xl or rounded-3xl, like this: */}
        <div className="bg-[#1a1721] rounded-2xl border border-[#2a2238] shadow-xl overflow-hidden">
          <SettingsForm initialProfile={profile} userEmail={user?.email || ""} />
        </div>
        
      </div>
    </div>
  );
}