"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/app/logout/action";
import AuthModal from "./auth-modal";

type NavbarProps = {
  profile: any; 
};

export default function Navbar({ profile }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNewBlogClick = () => {
    if (profile) {
      router.push("/blog");
    } else {
      setAuthModalOpen(true);
    }
  };

  const avatarUrl = profile?.avatar_url || "https://placehold.co/100x100/e2e8f0/64748b?text=U";
  const coverUrl = profile?.cover_photo_url || "https://i.imgur.com/VVeDHSv.jpeg";

  return (
    <>
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        message="You need an account to create a blog post." 
      />

      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? "py-2 shadow-lg" 
            : "py-4 sm:py-6" 
        }`}
      >
        {/* 1. Dynamic Base Background */}
        <div className={`absolute inset-0 -z-10 transition-all duration-300 ${
          isScrolled ? "bg-[#54248a] opacity-95" : "bg-gradient-to-b from-black/80 to-transparent"
        }`}></div>

        {/* 2. Triangles Overlay */}
        <div 
          className={`absolute inset-0 -z-10 mix-blend-overlay transition-opacity duration-450 ${
            isScrolled ? "opacity-0" : "opacity-50"
          }`}
          style={{
            backgroundImage: `url('https://i.imgur.com/RTpmOQQ.png')`,
            backgroundSize: "300px",
            backgroundRepeat: "repeat-x",
            backgroundPosition: "top left",
          }}
        ></div>

        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-between items-center gap-3 relative z-10">
          
          <div className="flex items-center gap-6 sm:gap-8">
            <Link href="/" className={`transition-all duration-450 flex items-center ${
              isScrolled ? "h-10 sm:h-10" : "h-16 sm:h-16"
            }`}>
              <img 
                src="https://i.imgur.com/tPA732c.png" 
                alt="fanalis!" 
                className="h-full w-auto object-contain drop-shadow-md" 
              />
            </Link>
            
            <nav className={`flex items-center gap-4 sm:gap-6 font-bold text-white drop-shadow-md transition-all duration-300 ${isScrolled ? "text-sm" : "text-base"}`}>
              <Link href="/" className="hover:text-pink-300 transition-colors">blogs</Link>
              <Link href="/authors" className="hover:text-pink-300 transition-colors">authors</Link>
              <button 
                onClick={handleNewBlogClick} 
                className="hover:text-pink-300 transition-colors uppercase-none font-bold"
              >
                new blog
              </button>
              <Link href="/about" className="hover:text-pink-300 transition-colors">about</Link>
            </nav>
          </div>

          {/* drop down right side profile */}
          {profile ? (
          <div className="relative group/profile flex gap-4 items-center cursor-pointer">
            
            {/* clickable username and pfp */}
            <Link href="/profile" className="flex gap-3 sm:gap-4 items-center">
              <div className={`hidden sm:flex gap-2 text-white/80 font-bold drop-shadow-md transition-all duration-300 ${isScrolled ? "text-sm" : "text-base"}`}>
                <span className="hover:text-pink-300 transition-colors">{profile?.username}</span>
              </div>
              
              <div className={`rounded-full bg-gray-500 overflow-hidden border-2 border-white shadow-md transition-all duration-300 ${isScrolled ? "w-9 h-9 sm:w-10 sm:h-10" : "w-12 h-12 sm:w-14 sm:h-14"}`}>
                <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
              </div>
            </Link>
          
            {/* dropdown when hovered */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1721] rounded-md shadow-2xl opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 flex flex-col overflow-hidden border border-[#2a2238]">
              <Link href="/profile">  
                <div className="relative h-24 w-full bg-cover bg-center" 
                  style={{ backgroundImage: `url('${coverUrl}')`}} >
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                    <div className="w-10 h-10 border-2 border-white rounded-lg flex items-center justify-center rotate-45 mt-2">
                      <div className="-rotate-45 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <span className="text-white font-semibold text-sm drop-shadow-md">{profile?.username}</span>
                  </div>
                </div>
              </Link>

              {/* dropdown items */}
              <div className="flex flex-col py-2">
                <Link href="/profile" className="px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/5 border-l-4 border-transparent hover:border-[#66ccff] hover:text-white transition-all">
                  My Profile
                </Link>
                <Link href="/settings" className="px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/5 border-l-4 border-transparent hover:border-[#66ccff] hover:text-white transition-all">
                  Profile Settings
                </Link>
                <button 
                  onClick={() => logoutUser()} 
                  className="w-full text-left px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/5 border-l-4 border-transparent hover:border-[#ff66aa] hover:text-white transition-all mt-1"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          // show when not logged in
          <div className={`flex items-center gap-2 font-bold text-white drop-shadow-md transition-all duration-300 ${isScrolled ? "text-sm" : "text-base"}`}>
            <Link href="/login" className="hover:text-pink-300 transition-colors">Login</Link>
            <span className="text-gray-500 font-normal">/</span>
            <Link href="/signup" className="hover:text-pink-300 transition-colors">Sign Up</Link>
          </div>
        )}

        </div>
      </header>
    </>
  );
}