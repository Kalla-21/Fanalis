"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; 
import AuthModal from "@/components/auth-modal";
import { getAuthUser } from "@/app/blog/action";

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

export default function Home() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("Explore");
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [hasLiked, setHasLiked] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const fetchUserAndPosts = async () => {
    setIsLoading(true);
    
    // 🚨 ASKING THE SERVER FOR AUTH INSTEAD OF THE BROWSER
    const serverUser = await getAuthUser();
    setUser(serverUser);

    if (activeTab === "My Blogs" && !serverUser) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    let query = supabase
      .from("posts")
      .select(`
        id, 
        title, 
        description, 
        image_url, 
        created_at, 
        author_id,
        profiles!posts_author_id_fkey (username, avatar_url),
        likes (user_id),
        comments (id)
      `)
      .order("created_at", { ascending: false });

    if (activeTab === "My Blogs" && serverUser) {
      query = query.eq("author_id", serverUser.id);
    } else if (activeTab === "Trending") {
      query = query.order("created_at", { ascending: false }); 
    }

    const { data, error } = await query;
    
    if (error) {
      console.error("❌ Supabase Fetch Error:", error.message);
    } else if (data) {
      setPosts(data as unknown as Post[]);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUserAndPosts();
  }, [activeTab]);

  useEffect(() => {
    if (!selectedPost) return;

    const rawText = selectedPost.description.replace(/<[^>]*>?/gm, '');
    const count = rawText.split(/\s+/).filter(Boolean).length;
    setWordCount(count);

    const fetchPostDetails = async () => {
      const { data: commentsData } = await supabase
        .from("comments")
        .select(`*, profiles!comments_author_id_fkey(username, avatar_url)`)
        .eq("post_id", selectedPost.id)
        .order("created_at", { ascending: true });
      
      if (commentsData) setComments(commentsData);

      if (user) {
        const { data: likeData } = await supabase
          .from("likes")
          .select("*")
          .eq("post_id", selectedPost.id)
          .eq("user_id", user.id)
          .single();
        
        setHasLiked(!!likeData);
      }
    };

    fetchPostDetails();
  }, [selectedPost, user]);

  const handleLike = async () => {
    if (!user) return setAuthModalOpen(true);
    if (!selectedPost) return;

    if (hasLiked) {
      await supabase.from("likes").delete().eq("post_id", selectedPost.id).eq("user_id", user.id);
      setHasLiked(false);
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, likes: p.likes.slice(0, -1) } : p));
    } else {
      await supabase.from("likes").insert({ post_id: selectedPost.id, user_id: user.id });
      setHasLiked(true);
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, likes: [...p.likes, { user_id: user.id }] } : p));
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setAuthModalOpen(true);
    if (!newComment.trim() || !selectedPost) return;

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: selectedPost.id,
        author_id: user.id,
        content: newComment
      })
      .select(`*, profiles!comments_author_id_fkey(username, avatar_url)`)
      .single();

    if (data) {
      setComments([...comments, data]);
      setNewComment("");
    }
  };

  const isLongForm = wordCount >= 500;

  return (
    <div className="w-full bg-[#1a1721] p-6 rounded-lg shadow-xl border border-[#2a2238] min-h-screen relative">
      
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        message="You need an account to interact with blogs." 
      />

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-center gap-2 text-gray-200 font-semibold text-lg pb-4">
          <h1>Explore different blogs and make your own!</h1>
        </div>
      </div>
  
      <div className="flex justify-between items-end border-b border-[#2a2238] mb-6 pb-2 px-2">
        <div className="flex gap-6">
          {["Trending", "Explore", "My Blogs"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 -mb-[9px] transition-colors ${
                activeTab === tab 
                  ? "font-bold text-[#ff66aa] border-b-2 border-[#ff66aa]" 
                  : "font-medium text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => user ? router.push("/blog") : setAuthModalOpen(true)}
          disabled={isLoading}
          className={`bg-[#ff66aa] hover:bg-[#ff4499] text-white font-bold py-1.5 px-4 rounded-md text-sm transition-all shadow-md mb-1 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Make a Blog
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-[#ff66aa] py-10 font-bold">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          {activeTab === "My Blogs" && !user 
            ? "Sign up and log in to make a blog!" 
            : "No posts found. Be the first to create one!"}
        </div>
      ) : (
        <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {posts.map((post) => (
            <div 
              key={post.id} 
              onClick={() => setSelectedPost(post)}
              className="break-inside-avoid rounded-lg overflow-hidden shadow-sm bg-[#1e1929] border border-[#2a2238] hover:shadow-md hover:border-[#ff66aa] transition-all cursor-pointer group"
            >
              {post.image_url ? (
                <div className="w-full relative bg-[#111111]">
                  <img 
                    src={post.image_url} 
                    alt={post.title} 
                    className="w-full h-auto block group-hover:opacity-80 transition-opacity" 
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-[#2a2238] to-[#1e1929] flex flex-col items-center justify-center p-6 text-center">
                   <span className="font-bold text-gray-200 text-lg leading-tight line-clamp-3">
                     {post.title}
                   </span>
                </div>
              )}
              
              <div className="p-3 bg-[#1e1929]">
                <h3 className="text-sm font-semibold text-gray-200 line-clamp-1 group-hover:text-[#ff66aa] transition-colors">{post.title}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400">{post.profiles?.username || "Unknown"}</span>
                  <span className="text-xs text-gray-500 flex gap-1 items-center hover:text-[#ff66aa] transition-colors">
                    ♡ {post.likes?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-10">
          <div className="absolute inset-0" onClick={() => setSelectedPost(null)}></div>
          
          {isLongForm ? (
            <div className="relative w-full max-w-4xl h-[90vh] bg-[#16131c] border border-[#2a2238] rounded-xl flex flex-col overflow-hidden shadow-2xl">
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/50 hover:bg-[#ff66aa] text-white rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {selectedPost.image_url && (
                  <div className="w-full bg-black/60 flex items-center justify-center p-6 border-b border-[#2a2238]">
                    <img 
                      src={selectedPost.image_url} 
                      alt={selectedPost.title} 
                      className="max-w-full max-h-[70vh] object-contain rounded-md shadow-lg"
                    />
                  </div>
                )}

                <div className="max-w-3xl mx-auto px-6 py-10">
                  <div className="flex items-center gap-4 mb-8">
                    <img src={selectedPost.profiles?.avatar_url || "https://placehold.co/100x100"} alt="Avatar" className="w-14 h-14 rounded-full object-cover border border-[#2a2238]" />
                    <div>
                      <h4 className="text-gray-100 font-bold text-lg">{selectedPost.profiles?.username || "Unknown"}</h4>
                      <p className="text-sm text-gray-500">{new Date(selectedPost.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <h2 className="text-white font-bold text-4xl mb-8 leading-tight">{selectedPost.title}</h2>
                  
                  <div 
                    className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:ml-6 [&>ol]:ml-6 [&>ul]:my-4 [&>ol]:my-4 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mt-8 [&>h1]:mb-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-3 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:my-2 [&_a]:text-[#ff66aa] [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: selectedPost.description }}
                  />

                  <hr className="border-[#2a2238] my-10" />

                  <div className="space-y-6 mb-8">
                    <h3 className="text-gray-400 text-sm font-semibold uppercase">{comments.length} Comments</h3>
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-4">
                        <img src={comment.profiles?.avatar_url || "https://placehold.co/100x100"} className="w-10 h-10 rounded-full bg-gray-800 shrink-0 object-cover" alt="" />
                        <div className="flex-1">
                          <div className="flex gap-2 items-baseline">
                            <span className="text-gray-200 text-sm font-bold">{comment.profiles?.username}</span>
                            <span className="text-gray-500 text-xs">{new Date(comment.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-[#2a2238] bg-[#1a1721] flex flex-col sm:flex-row items-center gap-4">
                <div className="flex gap-4">
                  <button onClick={handleLike} className="flex items-center gap-2 text-gray-300 hover:text-[#ff66aa] transition-colors">
                    <span className={`text-2xl ${hasLiked ? "text-[#ff66aa]" : ""}`}>♡</span>
                  </button>
                </div>
                <form onSubmit={handleCommentSubmit} className="flex-1 flex gap-2 w-full">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={user ? "Add a comment..." : "Log in to comment"}
                    disabled={!user}
                    className="flex-1 bg-[#231d2e] border border-[#3b304c] text-sm text-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-[#ff66aa] disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
                  />
                  <button type="submit" disabled={!user || !newComment.trim()} className="text-[#ff66aa] font-semibold text-sm px-4 disabled:opacity-50 hover:text-[#ff4499] transition-colors">
                    Post
                  </button>
                </form>
              </div>
            </div>

          ) : (

            <div className="relative w-full max-w-6xl h-[85vh] bg-[#111111] border border-[#2a2238] rounded-xl flex flex-col md:flex-row overflow-hidden shadow-2xl">
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/50 hover:bg-[#ff66aa] text-white rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>

              <div className="w-full md:w-[65%] bg-black flex items-center justify-center relative border-r border-[#2a2238] p-4">
                {selectedPost.image_url ? (
                  <img 
                    src={selectedPost.image_url} 
                    alt={selectedPost.title} 
                    className="max-w-full max-h-full object-contain rounded-md"
                  />
                ) : (
                  <div className="text-gray-500 text-lg">No image provided</div>
                )}
              </div>

              <div className="w-full md:w-[35%] flex flex-col h-full bg-[#16131c]">
                <div className="p-4 border-b border-[#2a2238] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0">
                    <img src={selectedPost.profiles?.avatar_url || "https://placehold.co/100x100"} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-gray-100 font-semibold text-sm">{selectedPost.profiles?.username || "Unknown"}</h4>
                    <p className="text-xs text-gray-500">{new Date(selectedPost.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                  <div>
                    <h2 className="text-white font-bold text-2xl mb-4">{selectedPost.title}</h2>
                    <div 
                      className="text-gray-300 text-sm whitespace-pre-wrap [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:ml-6 [&>ol]:ml-6 [&>ul]:my-2 [&>ol]:my-2 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:my-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:my-3 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:my-2 [&_a]:text-[#ff66aa] [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: selectedPost.description }}
                    />
                  </div>

                  <hr className="border-[#2a2238]" />

                  <div className="space-y-4">
                    <h3 className="text-gray-400 text-xs font-semibold uppercase">{comments.length} Comments</h3>
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <img src={comment.profiles?.avatar_url || "https://placehold.co/100x100"} className="w-8 h-8 rounded-full bg-gray-800 shrink-0 object-cover" alt="" />
                        <div className="flex-1">
                          <div className="flex gap-2 items-baseline">
                            <span className="text-gray-200 text-sm font-semibold">{comment.profiles?.username}</span>
                            <span className="text-gray-500 text-[10px]">{new Date(comment.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-300 text-sm mt-0.5">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t border-[#2a2238] bg-[#1a1721]">
                  <div className="flex gap-4 mb-4">
                    <button onClick={handleLike} className="flex items-center gap-2 text-gray-300 hover:text-[#ff66aa] transition-colors">
                      <span className={`text-xl ${hasLiked ? "text-[#ff66aa]" : ""}`}>♡</span>
                      <span className="text-sm font-medium">{hasLiked ? "Liked" : "Like"}</span>
                    </button>
                    <button onClick={() => !user && setAuthModalOpen(true)} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                      <span className="text-xl">💬</span>
                      <span className="text-sm font-medium">Comment</span>
                    </button>
                  </div>

                  <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={user ? "Add a comment..." : "Log in to comment"}
                      disabled={!user}
                      className="flex-1 bg-[#231d2e] border border-[#3b304c] text-sm text-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-[#ff66aa] disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
                    />
                    <button type="submit" disabled={!user || !newComment.trim()} className="text-[#ff66aa] font-semibold text-sm px-2 disabled:opacity-50 hover:text-[#ff4499] transition-colors">
                      Post
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}