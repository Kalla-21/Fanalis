import { getUserProfile } from "@/app/utils/getUser";
import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileTabs from "@/components/profile-tabs"; // We'll render the interactive tabs here

export default async function ProfilePage() {
  const { user, profile } = await getUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  const coverUrl = profile.cover_photo_url || "https://i.imgur.com/VVeDHSv.jpeg";
  const avatarUrl = profile.avatar_url || "https://placehold.co/150x150/e2e8f0/64748b?text=U";
  const coverPosition = profile.cover_position ?? 50;
  
  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-8 animate-in fade-in duration-500 pb-12">
      
      {/* 1. Header Profile Card */}
      <div className="bg-[#1a1721] rounded-2xl overflow-hidden shadow-2xl border border-[#2a2238] relative">
        <div className="relative h-48 sm:h-64 w-full bg-[#111]">
          <img 
            src={coverUrl} 
            alt="Cover" 
            className="w-full h-full object-cover"
            style={{ objectPosition: `center ${coverPosition}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1721] via-transparent to-transparent opacity-90"></div>
          
          <Link href="/settings" className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-lg backdrop-blur-sm transition-colors border border-white/10 shadow-md z-20">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </Link>
        </div>

        <div className="px-6 pb-6 relative flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-end">
          <div className="-mt-16 sm:-mt-20 relative z-10 shrink-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-4 border-[#1a1721] bg-gray-800 shadow-xl">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex-1 pb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-md">
              {profile.username}
            </h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Joined {joinedDate}</p>
          </div>
        </div>

        {profile.bio && (
          <div className="px-6 pb-6">
            <div className="bg-[#211c2c] p-4 rounded-xl border border-[#2a2238] text-gray-300 text-sm leading-relaxed">
              {profile.bio}
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive Tabs & Masonry Grid Component */}
      <ProfileTabs userId={user.id} />

    </div>
  );
}