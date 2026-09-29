"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/app/blog/action";
import AuthModal from "@/components/auth-modal";

type Post = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
  profiles: { username: string; avatar_url: string };
  likes: { user_id: string }[];
  comments: { id: string; author_id: string; content: string; created_at: string; profiles?: any }[];
};

// Aggressively strips Zalgo combining marks and unauthorized symbols. Allows Emojis.
const sanitizeText = (text: string) => {
  return text.replace(/[^a-zA-Z0-9\s:"'\[\]\{\}\\|><\?,\.\/\-=_\+\(\)!@#\$%\^&\*\p{Emoji}\u200D\uFE0F]/gu, '');
};

export default function ProfileTabs({ userId, serverUser }: { userId: string, serverUser: any }) {
  const [activeTab, setActiveTab] = useState<"My Blogs" | "Liked" | "Comments">("My Blogs");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [hasLiked, setHasLiked] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (selectedPost) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [selectedPost]);

  useEffect(() => {
    const fetchTabData = async () => {
      setIsLoading(true);
      if (activeTab === "My Blogs") {
        const { data } = await supabase.from("posts").select(`id, title, description, image_url, created_at, author_id, profiles!posts_author_id_fkey (username, avatar_url), likes (user_id), comments (id)`).eq("author_id", userId).order("created_at", { ascending: false });
        if (data) setPosts(data as unknown as Post[]);
      } 
      else if (activeTab === "Liked") {
        const { data: likesData } = await supabase.from("likes").select("post_id").eq("user_id", userId);
        if (likesData && likesData.length > 0) {
          const postIds = likesData.map((l) => l.post_id);
          const { data } = await supabase.from("posts").select(`id, title, description, image_url, created_at, author_id, profiles!posts_author_id_fkey (username, avatar_url), likes (user_id), comments (id)`).in("id", postIds).order("created_at", { ascending: false });
          if (data) setPosts(data as unknown as Post[]);
        } else setPosts([]);
      } 
      else if (activeTab === "Comments") {
        const { data: commentsData } = await supabase.from("comments").select("post_id").eq("author_id", userId);
        if (commentsData && commentsData.length > 0) {
          const postIds = Array.from(new Set(commentsData.map((c) => c.post_id)));
          const { data } = await supabase.from("posts").select(`id, title, description, image_url, created_at, author_id, profiles!posts_author_id_fkey (username, avatar_url), likes (user_id), comments (id)`).in("id", postIds).order("created_at", { ascending: false });
          if (data) setPosts(data as unknown as Post[]);
        } else setPosts([]);
      }
      setIsLoading(false);
    };
    fetchTabData();
  }, [activeTab, userId]);

  useEffect(() => {
    if (!selectedPost) return;

    const safeDescription = selectedPost.description || "";
    const rawText = safeDescription.replace(/<[^>]*>?/gm, '');
    setWordCount(rawText.split(/\s+/).filter(Boolean).length);

    const fetchPostDetails = async () => {
      const { data: commentsData } = await supabase.from("comments").select(`*, profiles!comments_author_id_fkey(username, avatar_url)`).eq("post_id", selectedPost.id).order("created_at", { ascending: true });
      if (commentsData) setComments(commentsData);

      if (serverUser) {
        const { data: likeData } = await supabase.from("likes").select("*").eq("post_id", selectedPost.id).eq("user_id", serverUser.id).single();
        setHasLiked(!!likeData);
      }
    };
    fetchPostDetails();
  }, [selectedPost, serverUser]);

  const handleModalLike = async () => {
    if (!serverUser || !selectedPost) return setAuthModalOpen(true);
    if (hasLiked) {
      await supabase.from("likes").delete().eq("post_id", selectedPost.id).eq("user_id", serverUser.id);
      setHasLiked(false);
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, likes: (p.likes || []).filter(l => l.user_id !== serverUser.id) } : p));
    } else {
      await supabase.from("likes").insert({ post_id: selectedPost.id, user_id: serverUser.id });
      setHasLiked(true);
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, likes: [...(p.likes || []), { user_id: serverUser.id }] } : p));
    }
  };

  const handleGridLike = async (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    e.preventDefault();
    if (!serverUser) return setAuthModalOpen(true);

    const isCurrentlyLiked = post.likes?.some(l => l.user_id === serverUser.id);
    if (isCurrentlyLiked) {
      setPosts(posts.map(p => p.id === post.id ? { ...p, likes: (p.likes || []).filter(l => l.user_id !== serverUser.id) } : p));
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", serverUser.id);
      if (selectedPost?.id === post.id) setHasLiked(false);
    } else {
      setPosts(posts.map(p => p.id === post.id ? { ...p, likes: [...(p.likes || []), { user_id: serverUser.id }] } : p));
      await supabase.from("likes").insert({ post_id: post.id, user_id: serverUser.id });
      if (selectedPost?.id === post.id) setHasLiked(true);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeText(e.target.value);
    if ([...cleaned].length <= 250) setNewComment(cleaned);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUser) return setAuthModalOpen(true);
    if (!newComment.trim() || !selectedPost) return;

    const { data } = await supabase.from("comments").insert({ post_id: selectedPost.id, author_id: serverUser.id, content: newComment }).select(`*, profiles!comments_author_id_fkey(username, avatar_url)`).single();
    if (data) {
      setComments([...comments, data]);
      setNewComment("");
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, comments: [...(p.comments || []), { id: data.id } as any] } : p));
    }
  };

  const handleDeletePost = async () => {
    if (!serverUser || !selectedPost || serverUser.id !== selectedPost.author_id) return;
    if (!window.confirm("Are you sure you want to delete this blog? This action cannot be undone.")) return;

    const { error } = await supabase.from("posts").delete().eq("id", selectedPost.id);
    if (!error) {
      setPosts(posts.filter(p => p.id !== selectedPost.id));
      setSelectedPost(null);
    }
  };

  const handleDeleteComment = async (commentId: string, commentAuthorId: string) => {
    if (!serverUser || serverUser.id !== commentAuthorId) return;
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (!error) setComments(comments.filter(c => c.id !== commentId));
  };

  const currentPost = posts.find(p => p.id === selectedPost?.id) || selectedPost;
  const isLongForm = wordCount >= 500 || !currentPost?.image_url;

  return (
    <div className="bg-[#1a1721] rounded-2xl border border-[#2a2238] p-6 shadow-xl min-h-[600px]">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} message="You need an account to interact with blogs." />

      <div className="flex items-center gap-6 border-b border-[#2a2238] mb-6 pb-0">
        {(["My Blogs", "Liked", "Comments"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`font-bold text-sm pb-3 border-b-2 transition-colors relative top-[1px] ${activeTab === tab ? "text-[#ff66aa] border-[#ff66aa]" : "text-gray-400 hover:text-gray-200 border-transparent"}`}>{tab}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center text-[#ff66aa] py-20 font-bold">Loading {activeTab.toLowerCase()}...</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500 py-20">No items found in {activeTab}.</div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {posts.map((post) => {
            const isLiked = post.likes?.some(l => l.user_id === serverUser?.id);
            return (
              <div 
                key={post.id} 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedPost(post); }}
                className="bg-[#2a2238] rounded-xl overflow-hidden break-inside-avoid shadow-lg flex flex-col group cursor-pointer border border-[#3e3254]/30 hover:border-[#52446e] transition-colors relative"
              >
                {post.image_url ? (
                  <div className="w-full relative bg-[#111111]">
                    <img src={post.image_url} alt={post.title} className="w-full h-auto block group-hover:opacity-90 transition-opacity" />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-[#2a2238] to-[#1e1929] flex items-center justify-center p-4 text-center">
                    <span className="text-[#ff66aa] font-bold text-lg line-clamp-2">{post.title}</span>
                  </div>
                )}
                <div className="bg-[#1e1928] p-4 relative flex flex-col gap-1 border-t border-black/20">
                  <h3 className="text-white font-bold text-[13px] truncate pr-6 group-hover:text-[#ff66aa] transition-colors">{post.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-400 truncate">{post.profiles?.username || "Unknown"}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-gray-500 flex items-center gap-1 text-xs">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {post.comments?.length || 0}
                      </span>
                      <button onClick={(e) => handleGridLike(e, post)} className={`flex items-center gap-1 text-xs hover:text-[#ff66aa] transition-colors z-10 ${isLiked ? "text-[#ff66aa]" : "text-gray-500"}`}>
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        {post.likes?.length || 0}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PORTALED MODAL */}
      {mounted && selectedPost && currentPost && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 pt-20 pb-4 md:p-8 md:pt-20">
          <div className="absolute inset-0" onClick={() => setSelectedPost(null)}></div>
          
          {isLongForm ? (
            <div className="relative w-full max-w-4xl h-[80vh] max-h-[calc(100vh-6rem)] bg-[#16131c] border border-[#2a2238] rounded-xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="absolute top-4 right-4 z-50 flex gap-3">
                {serverUser?.id === currentPost.author_id && (
                  <button onClick={handleDeletePost} className="w-8 h-8 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors border border-white/10">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                  </button>
                )}
                <button onClick={() => setSelectedPost(null)} className="w-8 h-8 bg-black/50 hover:bg-[#ff66aa] text-white rounded-full flex items-center justify-center transition-colors border border-white/10">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                {currentPost.image_url && (
                  <div className="w-full bg-black/60 flex items-center justify-center p-6 border-b border-[#2a2238]">
                    <img src={currentPost.image_url} alt={currentPost.title} className="max-w-full max-h-[70vh] object-contain rounded-md shadow-lg" />
                  </div>
                )}
                <div className="max-w-3xl mx-auto px-6 py-10 pr-24">
                  <div className="flex items-center gap-4 mb-8">
                    <img src={currentPost.profiles?.avatar_url || "https://placehold.co/100x100"} alt="Avatar" className="w-14 h-14 rounded-full object-cover border border-[#2a2238]" />
                    <div>
                      <h4 className="text-gray-100 font-bold text-lg">{currentPost.profiles?.username || "Unknown"}</h4>
                      <p className="text-sm text-gray-500">{new Date(currentPost.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <h2 className="text-white font-bold text-4xl mb-8 leading-tight break-words">{currentPost.title}</h2>
                  <div className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap break-words overflow-hidden max-w-full [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:ml-6 [&>ol]:ml-6 [&>ul]:my-4 [&>ol]:my-4 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mt-8 [&>h1]:mb-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-3 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:my-2 [&_a]:text-[#ff66aa] [&_a]:underline" dangerouslySetInnerHTML={{ __html: currentPost.description }} />

                  <div className="flex gap-6 mt-10 mb-6 border-b border-[#2a2238] pb-4">
                    <h3 className="text-gray-400 text-sm font-semibold uppercase">{comments.length} Comments</h3>
                    <h3 className="text-gray-400 text-sm font-semibold uppercase">{currentPost.likes?.length || 0} Likes</h3>
                  </div>

                  <div className="space-y-6 mb-8">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-4 group/comment">
                        <img src={comment.profiles?.avatar_url || "https://placehold.co/100x100"} className="w-10 h-10 rounded-full bg-gray-800 shrink-0 object-cover" alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <div className="flex gap-2 items-baseline">
                              <span className="text-gray-200 text-sm font-bold truncate">{comment.profiles?.username}</span>
                              <span className="text-gray-500 text-xs shrink-0">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            {serverUser?.id === comment.author_id && (
                              <button onClick={() => handleDeleteComment(comment.id, comment.author_id)} className="opacity-0 group-hover/comment:opacity-100 text-gray-500 hover:text-red-500 transition-all p-1">
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                              </button>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm mt-1 break-words overflow-hidden max-w-full">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-[#2a2238] bg-[#1a1721] flex flex-col sm:flex-row items-center gap-4 shrink-0">
                <button onClick={handleModalLike} className="flex items-center gap-2 text-gray-300 hover:text-[#ff66aa] transition-colors shrink-0">
                  <svg width="24" height="24" fill={hasLiked ? "#ff66aa" : "none"} viewBox="0 0 24 24" stroke={hasLiked ? "#ff66aa" : "currentColor"} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
                <form onSubmit={handleCommentSubmit} className="flex gap-2 w-full">
                  <input type="text" value={newComment} onChange={handleCommentChange} placeholder={serverUser ? "Add a comment (alphanumeric, max 250 chars)..." : "Log in to comment"} disabled={!serverUser} className="flex-1 bg-[#231d2e] border border-[#3b304c] text-sm text-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-[#ff66aa] disabled:opacity-50 shadow-inner min-w-0" />
                  <button type="submit" disabled={!serverUser || !newComment.trim()} className="text-[#ff66aa] font-semibold text-sm px-4 disabled:opacity-50 hover:text-[#ff4499] transition-colors shrink-0">Post</button>
                </form>
              </div>
            </div>

          ) : (

            <div className="relative w-full max-w-6xl h-[80vh] max-h-[calc(100vh-6rem)] bg-[#111111] border border-[#2a2238] rounded-xl flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="absolute top-4 right-4 z-50 flex gap-3">
                {serverUser?.id === currentPost.author_id && (
                  <button onClick={handleDeletePost} className="w-8 h-8 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors border border-white/10">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                  </button>
                )}
                <button onClick={() => setSelectedPost(null)} className="w-8 h-8 bg-black/50 hover:bg-[#ff66aa] text-white rounded-full flex items-center justify-center transition-colors border border-white/10">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="w-full md:w-[60%] h-[35%] md:h-full bg-black flex items-center justify-center relative border-b md:border-b-0 md:border-r border-[#2a2238] p-4 shrink-0 min-w-0">
                {currentPost.image_url ? (
                  <img src={currentPost.image_url} alt={currentPost.title} className="max-w-full max-h-full object-contain rounded-md" />
                ) : (
                  <div className="text-gray-500 text-lg">No image provided</div>
                )}
              </div>

              <div className="w-full md:w-[40%] h-[65%] md:h-full flex flex-col bg-[#16131c] shrink-0 min-w-[320px] overflow-hidden">
                
                <div className="p-4 pr-24 border-b border-[#2a2238] flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0">
                    <img src={currentPost.profiles?.avatar_url || "https://placehold.co/100x100"} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-gray-100 font-semibold text-sm truncate">{currentPost.profiles?.username || "Unknown"}</h4>
                    <p className="text-xs text-gray-500 truncate">{new Date(currentPost.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar min-h-0">
                  <div>
                    <h2 className="text-white font-bold text-2xl mb-4 break-words">{currentPost.title}</h2>
                    <div className="text-gray-300 text-sm whitespace-pre-wrap break-words overflow-hidden max-w-full [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:ml-6 [&>ol]:ml-6 [&>ul]:my-2 [&>ol]:my-2 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:my-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:my-3 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:my-2 [&_a]:text-[#ff66aa] [&_a]:underline" dangerouslySetInnerHTML={{ __html: currentPost.description || "" }} />
                  </div>

                  <div className="flex gap-6 mt-6 mb-4 border-b border-[#2a2238] pb-4">
                    <h3 className="text-gray-400 text-xs font-semibold uppercase">{comments.length} Comments</h3>
                    <h3 className="text-gray-400 text-xs font-semibold uppercase">{currentPost.likes?.length || 0} Likes</h3>
                  </div>

                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 group/comment">
                        <img src={comment.profiles?.avatar_url || "https://placehold.co/100x100"} className="w-8 h-8 rounded-full bg-gray-800 shrink-0 object-cover" alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <div className="flex gap-2 items-baseline">
                              <span className="text-gray-200 text-sm font-semibold truncate">{comment.profiles?.username}</span>
                              <span className="text-gray-500 text-[10px] shrink-0">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            {serverUser?.id === comment.author_id && (
                              <button onClick={() => handleDeleteComment(comment.id, comment.author_id)} className="opacity-0 group-hover/comment:opacity-100 text-gray-500 hover:text-red-500 transition-all p-1">
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                              </button>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm mt-0.5 break-words overflow-hidden max-w-full">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t border-[#2a2238] bg-[#1a1721] flex flex-col gap-3 shrink-0">
                  <div className="flex gap-4">
                    <button onClick={handleModalLike} className="flex items-center gap-2 text-gray-300 hover:text-[#ff66aa] transition-colors shrink-0">
                      <svg width="24" height="24" fill={hasLiked ? "#ff66aa" : "none"} viewBox="0 0 24 24" stroke={hasLiked ? "#ff66aa" : "currentColor"} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      <span className="text-sm font-medium">{hasLiked ? "Liked" : "Like"}</span>
                    </button>
                  </div>
                  <form onSubmit={handleCommentSubmit} className="flex gap-2 w-full">
                    <input type="text" value={newComment} onChange={handleCommentChange} placeholder={serverUser ? "Add a comment (alphanumeric, max 250 chars)..." : "Log in to comment"} disabled={!serverUser} className="flex-1 bg-[#231d2e] border border-[#3b304c] text-sm text-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-[#ff66aa] disabled:opacity-50 shadow-inner min-w-0" />
                    <button type="submit" disabled={!serverUser || !newComment.trim()} className="text-[#ff66aa] font-semibold text-sm px-4 disabled:opacity-50 hover:text-[#ff4499] transition-colors shrink-0">Post</button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

    </div>
  );
}