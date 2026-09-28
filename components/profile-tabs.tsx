"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Post = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
  profiles: { username: string; avatar_url: string };
  likes: { user_id: string }[];
  comments: { id: string }[];
};

export default function ProfileTabs({ userId }: { userId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"My Blogs" | "Liked" | "Comments">("My Blogs");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTabData = async () => {
      setIsLoading(true);

      if (activeTab === "My Blogs") {
        const { data } = await supabase
          .from("posts")
          .select(`
            id, title, description, image_url, created_at, author_id,
            profiles!posts_author_id_fkey (username, avatar_url),
            likes (user_id),
            comments (id)
          `)
          .eq("author_id", userId)
          .order("created_at", { ascending: false });

        if (data) setPosts(data as unknown as Post[]);
      } 
      else if (activeTab === "Liked") {
        const { data: likesData } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", userId);

        if (likesData && likesData.length > 0) {
          const postIds = likesData.map((l) => l.post_id);
          const { data } = await supabase
            .from("posts")
            .select(`
              id, title, description, image_url, created_at, author_id,
              profiles!posts_author_id_fkey (username, avatar_url),
              likes (user_id),
              comments (id)
            `)
            .in("id", postIds)
            .order("created_at", { ascending: false });

          if (data) setPosts(data as unknown as Post[]);
        } else {
          setPosts([]);
        }
      } 
      else if (activeTab === "Comments") {
        const { data: commentsData } = await supabase
          .from("comments")
          .select("post_id")
          .eq("user_id", userId);

        if (commentsData && commentsData.length > 0) {
          const postIds = Array.from(new Set(commentsData.map((c) => c.post_id)));
          const { data } = await supabase
            .from("posts")
            .select(`
              id, title, description, image_url, created_at, author_id,
              profiles!posts_author_id_fkey (username, avatar_url),
              likes (user_id),
              comments (id)
            `)
            .in("id", postIds)
            .order("created_at", { ascending: false });

          if (data) setPosts(data as unknown as Post[]);
        } else {
          setPosts([]);
        }
      }

      setIsLoading(false);
    };

    fetchTabData();
  }, [activeTab, userId]);

  return (
    <div className="bg-[#1a1721] rounded-2xl border border-[#2a2238] p-6 shadow-xl min-h-[600px]">
      
      {/* Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-[#2a2238] mb-6 pb-0">
        {(["My Blogs", "Liked", "Comments"] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-bold text-sm pb-3 border-b-2 transition-colors relative top-[1px] ${
              activeTab === tab 
                ? "text-[#ff66aa] border-[#ff66aa]" 
                : "text-gray-400 hover:text-gray-200 border-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      {isLoading ? (
        <div className="text-center text-[#ff66aa] py-20 font-bold">Loading {activeTab.toLowerCase()}...</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500 py-20">No items found in {activeTab}.</div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {posts.map((post) => (
            <div 
              key={post.id} 
              onClick={() => router.push(`/?post=${post.id}`)}
              className="bg-[#2a2238] rounded-xl overflow-hidden break-inside-avoid shadow-lg flex flex-col group cursor-pointer border border-[#3e3254]/30 hover:border-[#52446e] transition-colors"
            >
              {post.image_url ? (
                <div className="w-full relative bg-[#111111]">
                  <img 
                    src={post.image_url} 
                    alt={post.title} 
                    className="w-full h-auto block group-hover:opacity-90 transition-opacity" 
                  />
                </div>
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-[#2a2238] to-[#1e1929] flex items-center justify-center p-4 text-center">
                  <span className="text-[#ff66aa] font-bold text-lg line-clamp-2">
                    {post.title}
                  </span>
                </div>
              )}

              <div className="bg-[#1e1928] p-4 relative flex flex-col gap-1 border-t border-black/20">
                <h3 className="text-white font-bold text-[13px] truncate pr-6">{post.title}</h3>
                <p className="text-gray-400 text-xs truncate">{post.profiles?.username || "Unknown"}</p>

                <span className="absolute bottom-4 right-4 text-gray-500 flex items-center gap-1 text-xs">
                  ♡ {post.likes?.length || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}