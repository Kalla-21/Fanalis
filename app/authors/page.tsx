"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/app/blog/action";
import AuthModal from "@/components/auth-modal";

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  cover_photo_url: string | null;
  cover_position: number | null;
  bio: string | null;
  created_at: string;
};

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

const killZalgo = (text: string) => (text || "").replace(/[\u0300-\u036f\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/g, '');
const cleanInput = (text: string) => killZalgo(text).replace(/[^a-zA-Z0-9\s:'"\[\]\{\}\\|><\?,\.\/\-=_\+\(\)!@#\$%\^&\*\p{Emoji}\u200D\uFE0F]/gu, '');

export default function AuthorsPage() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [authors, setAuthors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const [selectedAuthor, setSelectedAuthor] = useState<Profile | null>(null);
  const [authorPosts, setAuthorPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [hasLiked, setHasLiked] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (selectedAuthor || selectedPost) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [selectedAuthor, selectedPost]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const user = await getAuthUser();
      if (user) setAuthUser(user);
      const { data } = await supabase.from("profiles").select("*").order("username", { ascending: true });
      if (data) setAuthors(data);
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedAuthor) { setAuthorPosts([]); return; }
    const fetchAuthorPosts = async () => {
      setPostsLoading(true);
      const { data } = await supabase.from("posts").select(`id, title, description, image_url, created_at, author_id, profiles!posts_author_id_fkey (username, avatar_url), likes (user_id), comments (id)`).eq("author_id", selectedAuthor.id).order("created_at", { ascending: false });
      if (data) setAuthorPosts(data as unknown as Post[]);
      setPostsLoading(false);
    };
    fetchAuthorPosts();
  }, [selectedAuthor]);

  useEffect(() => {
    if (!selectedPost) return;

    const safeDescription = selectedPost.description || "";
    const rawText = safeDescription.replace(/<[^>]*>?/gm, '');
    setWordCount(rawText.split(/\s+/).filter(Boolean).length);

    const fetchPostDetails = async () => {
      const { data: commentsData } = await supabase.from("comments").select(`*, profiles!comments_author_id_fkey(username, avatar_url)`).eq("post_id", selectedPost.id).order("created_at", { ascending: true });
      if (commentsData) setComments(commentsData);

      if (authUser) {
        const { data: likeData } = await supabase.from("likes").select("*").eq("post_id", selectedPost.id).eq("user_id", authUser.id).single();
        setHasLiked(!!likeData);
      }
    };
    fetchPostDetails();
  }, [selectedPost, authUser]);

  const handleModalLike = async () => {
    if (!authUser || !selectedPost) return setAuthModalOpen(true);
    if (hasLiked) {
      await supabase.from("likes").delete().eq("post_id", selectedPost.id).eq("user_id", authUser.id);
      setHasLiked(false);
      setAuthorPosts(authorPosts.map(p => p.id === selectedPost.id ? { ...p, likes: (p.likes || []).filter(l => l.user_id !== authUser.id) } : p));
    } else {
      await supabase.from("likes").insert({ post_id: selectedPost.id, user_id: authUser.id });
      setHasLiked(true);
      setAuthorPosts(authorPosts.map(p => p.id === selectedPost.id ? { ...p, likes: [...(p.likes || []), { user_id: authUser.id }] } : p));
    }
  };

  const handleGridLike = async (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    e.preventDefault();
    if (!authUser) return setAuthModalOpen(true);

    const isCurrentlyLiked = post.likes?.some(l => l.user_id === authUser.id);
    if (isCurrentlyLiked) {
      setAuthorPosts(authorPosts.map(p => p.id === post.id ? { ...p, likes: (p.likes || []).filter(l => l.user_id !== authUser.id) } : p));
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", authUser.id);
      if (selectedPost?.id === post.id) setHasLiked(false);
    } else {
      setAuthorPosts(authorPosts.map(p => p.id === post.id ? { ...p, likes: [...(p.likes || []), { user_id: authUser.id }] } : p));
      await supabase.from("likes").insert({ post_id: post.id, user_id: authUser.id });
      if (selectedPost?.id === post.id) setHasLiked(true);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewComment(cleanInput(e.target.value).slice(0, 250));
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return setAuthModalOpen(true);
    if (!newComment.trim() || !selectedPost) return;

    const { data } = await supabase.from("comments").insert({ post_id: selectedPost.id, author_id: authUser.id, content: cleanInput(newComment).slice(0, 250) }).select(`*, profiles!comments_author_id_fkey(username, avatar_url)`).single();
    if (data) {
      setComments([...comments, data]);
      setNewComment("");
      setAuthorPosts(authorPosts.map(p => p.id === selectedPost.id ? { ...p, comments: [...(p.comments || []), { id: data.id } as any] } : p));
    }
  };

  const handleDeletePost = async () => {
    if (!authUser || !selectedPost || authUser.id !== selectedPost.author_id) return;
    if (!window.confirm("Are you sure you want to delete this blog? This action cannot be undone.")) return;

    const { error } = await supabase.from("posts").delete().eq("id", selectedPost.id);
    if (!error) {
      setAuthorPosts(authorPosts.filter(p => p.id !== selectedPost.id));
      setSelectedPost(null);
    }
  };

  const handleDeleteComment = async (commentId: string, commentAuthorId: string) => {
    if (!authUser || authUser.id !== commentAuthorId) return;
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (!error) setComments(comments.filter(c => c.id !== commentId));
  };

  const currentPost = authorPosts.find(p => p.id === selectedPost?.id) || selectedPost;
  const isLongForm = wordCount >= 500 || !currentPost?.image_url;

  return (
    <div className="w-full bg-[#1a1721] p-6 rounded-lg shadow-xl border border-[#2a2238] min-h-screen relative">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} message="You need an account to interact with blogs." />
      
      <div className="mb-6 border-b border-[#2a2238] pb-4 px-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Explore Authors</h1>
        <p className="text-gray-400 mt-2 text-sm">Discover creators and read their latest blogs.</p>
      </div>

      {loading ? (
        <div className="text-center text-[#ff66aa] py-20 font-bold">Loading authors...</div>
      ) : authors.length === 0 ? (
        <div className="text-center text-gray-500 py-20">No authors found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {authors.map((author) => {
            const joinedDate = new Date(author.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" });
            const avatar = author.avatar_url || "https://placehold.co/150x150/e2e8f0/64748b?text=U";
            const cover = author.cover_photo_url || "https://i.imgur.com/VVeDHSv.jpeg";

            return (
              <div key={author.id} onClick={() => setSelectedAuthor(author)} className="relative overflow-hidden rounded-xl bg-[#211c2c] border border-[#3e3254]/50 hover:border-[#ff66aa] transition-all cursor-pointer group shadow-lg h-24 flex items-center p-3">
                <div className="absolute inset-0 z-0">
                  <img src={cover} alt="cover" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" style={{ objectPosition: `center ${author.cover_position ?? 50}%` }} />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1a1721] via-[#1a1721]/80 to-transparent"></div>
                </div>
                <div className="relative z-10 flex items-center gap-4 w-full">
                  <div className="relative">
                    <img src={avatar} alt={killZalgo(author.username)} className="w-14 h-14 rounded-lg object-cover border-2 border-[#2a2238] shadow-md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base truncate drop-shadow-md group-hover:text-[#ff66aa] transition-colors">{killZalgo(author.username)}</h3>
                    <p className="text-gray-400 text-xs truncate">Joined {joinedDate}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AUTHOR MODAL */}
      {mounted && selectedAuthor && createPortal(
        <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-10 overflow-y-auto custom-scrollbar">
          <div className="fixed inset-0" onClick={() => setSelectedAuthor(null)}></div>
          <div className="relative w-full max-w-5xl bg-[#16131c] border border-[#2a2238] rounded-2xl flex flex-col overflow-hidden shadow-2xl my-auto z-10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedAuthor(null)} className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/50 hover:bg-[#ff66aa] text-white rounded-full flex items-center justify-center transition-colors border border-white/10">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex-1 overflow-y-auto max-h-[85vh] custom-scrollbar pb-10">
              <div className="relative">
                <div className="relative h-48 sm:h-64 w-full bg-[#111]">
                  <img src={selectedAuthor.cover_photo_url || "https://i.imgur.com/VVeDHSv.jpeg"} alt="Cover" className="w-full h-full object-cover" style={{ objectPosition: `center ${selectedAuthor.cover_position ?? 50}%` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16131c] via-[#16131c]/60 to-transparent"></div>
                </div>
                <div className="px-6 pb-6 relative flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-end">
                  <div className="-mt-16 sm:-mt-20 relative z-10 shrink-0">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-4 border-[#16131c] bg-gray-800 shadow-xl">
                      <img src={selectedAuthor.avatar_url || "https://placehold.co/150x150/e2e8f0/64748b?text=U"} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex-1 pb-2">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-md">{killZalgo(selectedAuthor.username)}</h1>
                    <p className="text-sm text-gray-400 mt-1 font-medium">Joined {new Date(selectedAuthor.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                  </div>
                </div>
                {selectedAuthor.bio && (
                  <div className="px-6 pb-6">
                    <div className="bg-[#211c2c] p-4 rounded-xl border border-[#2a2238] text-gray-300 text-sm leading-relaxed">{killZalgo(selectedAuthor.bio)}</div>
                  </div>
                )}
              </div>
              <div className="px-6">
                <div className="flex items-center gap-6 border-b border-[#2a2238] mb-6 pb-0">
                  <button className="text-[#ff66aa] font-bold text-sm pb-3 border-b-2 border-[#ff66aa] relative top-[1px]">{killZalgo(selectedAuthor.username)}&apos;s Blogs</button>
                </div>
                {postsLoading ? (
                  <div className="text-center text-[#ff66aa] py-10 font-bold">Loading blogs...</div>
                ) : authorPosts.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">This author hasn&apos;t published any blogs yet.</div>
                ) : (
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                    {authorPosts.map((post) => {
                      const isLiked = post.likes?.some(l => l.user_id === authUser?.id);
                      return (
                        <div key={post.id} onClick={() => setSelectedPost(post)} className="bg-[#2a2238] rounded-xl overflow-hidden break-inside-avoid shadow-lg flex flex-col cursor-pointer hover:border-[#ff66aa] border border-[#3e3254]/30 transition-colors group relative">
                          {post.image_url ? (
                            <div className="w-full relative bg-[#111111]"><img src={post.image_url} alt={killZalgo(post.title)} className="w-full h-auto block group-hover:opacity-80 transition-opacity" /></div>
                          ) : (
                            <div className="w-full h-40 bg-gradient-to-br from-[#2a2238] to-[#1e1929] flex items-center justify-center p-4 text-center">
                              <span className="text-[#ff66aa] font-bold text-lg line-clamp-2 break-words overflow-hidden">{killZalgo(post.title)}</span>
                            </div>
                          )}
                          <div className="bg-[#1e1928] p-4 relative flex flex-col gap-1 border-t border-black/20">
                            <h3 className="text-white font-bold text-[13px] truncate pr-6 group-hover:text-[#ff66aa] transition-colors break-words overflow-hidden">{killZalgo(post.title)}</h3>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-400 truncate">{killZalgo(selectedAuthor.username)}</span>
                              <div className="flex items-center gap-3">
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
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PORTALED POST PREVIEW MODAL */}
      {mounted && selectedPost && currentPost && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 pt-20 pb-4 md:p-8 md:pt-20">
          <div className="absolute inset-0" onClick={() => setSelectedPost(null)}></div>
          
          {isLongForm ? (
            <div className="relative w-full max-w-4xl h-[80vh] max-h-[calc(100vh-6rem)] bg-[#16131c] border border-[#2a2238] rounded-xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="absolute top-4 right-4 z-50 flex gap-3">
                {authUser?.id === currentPost.author_id && (
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
                    <img src={currentPost.image_url} alt={killZalgo(currentPost.title)} className="max-w-full max-h-[70vh] object-contain rounded-md shadow-lg" />
                  </div>
                )}
                <div className="max-w-3xl mx-auto px-6 py-10 pr-24">
                  <div className="flex items-center gap-4 mb-8">
                    <img src={currentPost.profiles?.avatar_url || "https://placehold.co/100x100"} alt="Avatar" className="w-14 h-14 rounded-full object-cover border border-[#2a2238]" />
                    <div>
                      <h4 className="text-gray-100 font-bold text-lg">{killZalgo(currentPost.profiles?.username || "Unknown")}</h4>
                      <p className="text-sm text-gray-500">{new Date(currentPost.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <h2 className="text-white font-bold text-4xl mb-8 leading-tight break-words overflow-hidden max-h-[200px]">{killZalgo(currentPost.title)}</h2>
                  <div className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap break-words overflow-hidden max-w-full [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:ml-6 [&>ol]:ml-6 [&>ul]:my-4 [&>ol]:my-4 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mt-8 [&>h1]:mb-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-3 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:my-2 [&_a]:text-[#ff66aa] [&_a]:underline" dangerouslySetInnerHTML={{ __html: killZalgo(currentPost.description) }} />

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
                              <span className="text-gray-200 text-sm font-bold truncate">{killZalgo(comment.profiles?.username)}</span>
                              <span className="text-gray-500 text-xs shrink-0">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            {authUser?.id === comment.author_id && (
                              <button onClick={() => handleDeleteComment(comment.id, comment.author_id)} className="opacity-0 group-hover/comment:opacity-100 text-gray-500 hover:text-red-500 transition-all p-1">
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                              </button>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm mt-1 break-words overflow-hidden max-w-full">{killZalgo(comment.content)}</p>
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
                  <input type="text" value={newComment} onChange={handleCommentChange} placeholder={authUser ? "Add a comment (alphanumeric, max 250 chars)..." : "Log in to comment"} disabled={!authUser} className="flex-1 bg-[#231d2e] border border-[#3b304c] text-sm text-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-[#ff66aa] disabled:opacity-50 shadow-inner overflow-hidden" />
                  <button type="submit" disabled={!authUser || !newComment.trim()} className="text-[#ff66aa] font-semibold text-sm px-4 disabled:opacity-50 hover:text-[#ff4499] transition-colors shrink-0">Post</button>
                </form>
              </div>
            </div>

          ) : (

            <div className="relative w-full max-w-6xl h-[80vh] max-h-[calc(100vh-6rem)] bg-[#111111] border border-[#2a2238] rounded-xl flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="absolute top-4 right-4 z-50 flex gap-3">
                {authUser?.id === currentPost.author_id && (
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
                  <img src={currentPost.image_url} alt={killZalgo(currentPost.title)} className="max-w-full max-h-full object-contain rounded-md" />
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
                    <h4 className="text-gray-100 font-semibold text-sm truncate">{killZalgo(currentPost.profiles?.username || "Unknown")}</h4>
                    <p className="text-xs text-gray-500 truncate">{new Date(currentPost.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar min-h-0">
                  <div>
                    <h2 className="text-white font-bold text-2xl mb-4 break-words overflow-hidden max-h-[150px]">{killZalgo(currentPost.title)}</h2>
                    <div className="text-gray-300 text-sm whitespace-pre-wrap break-words overflow-hidden max-w-full [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:ml-6 [&>ol]:ml-6 [&>ul]:my-2 [&>ol]:my-2 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:my-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:my-3 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:my-2 [&_a]:text-[#ff66aa] [&_a]:underline" dangerouslySetInnerHTML={{ __html: killZalgo(currentPost.description || "") }} />
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
                              <span className="text-gray-200 text-sm font-semibold truncate">{killZalgo(comment.profiles?.username)}</span>
                              <span className="text-gray-500 text-[10px] shrink-0">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            {authUser?.id === comment.author_id && (
                              <button onClick={() => handleDeleteComment(comment.id, comment.author_id)} className="opacity-0 group-hover/comment:opacity-100 text-gray-500 hover:text-red-500 transition-all p-1" title="Delete Comment">
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                              </button>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm mt-0.5 break-words overflow-hidden max-w-full">{killZalgo(comment.content)}</p>
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
                    <input type="text" value={newComment} onChange={handleCommentChange} placeholder={authUser ? "Add a comment (alphanumeric, max 250 chars)..." : "Log in to comment"} disabled={!authUser} className="flex-1 bg-[#231d2e] border border-[#3b304c] text-sm text-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-[#ff66aa] disabled:opacity-50 shadow-inner overflow-hidden" />
                    <button type="submit" disabled={!authUser || !newComment.trim()} className="text-[#ff66aa] font-semibold text-sm px-4 disabled:opacity-50 hover:text-[#ff4499] transition-colors shrink-0">Post</button>
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