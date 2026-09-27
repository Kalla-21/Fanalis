"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { logoutUser } from "@/app/logout/action";

type NavbarProps = {
  profile: any; 
};

export default function Navbar({ profile }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-[#54248a] py-2 shadow-lg" 
            : "bg-gradient-to-b from-black/80 to-transparent py-6" 
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center relative z-10">
          
          <div className="flex items-center gap-8">
            <Link href="/" className={`font-bold tracking-tighter text-white drop-shadow-md transition-all duration-300 ${isScrolled ? "text-3xl" : "text-4xl"}`}>
              fanalis!
            </Link>
            
            <nav className={`flex items-center gap-6 font-bold text-white drop-shadow-md transition-all duration-300 ${isScrolled ? "text-sm" : "text-base"}`}>
              <Link href="/" className="hover:text-pink-300 transition-colors">blogs</Link>
              <Link href="/authors" className="hover:text-pink-300 transition-colors">authors</Link>
              <Link href="/about" className="hover:text-pink-300 transition-colors">about</Link>
            </nav>
          </div>

          {/* drop down right side profile */}
          {profile ? (
          <div className="relative group/profile flex gap-4 items-center cursor-pointer">
            
            {/* clickable username and pfp */}
            <Link href="/profile" className="flex gap-4 items-center">
              <div className={`flex gap-2 text-white/80 font-bold drop-shadow-md transition-all duration-300 ${isScrolled ? "text-sm" : "text-base"}`}>
                <span className="hover:text-pink-300 transition-colors">{profile?.username}</span>
              </div>
              
              <div className={`rounded-full bg-gray-500 overflow-hidden border-2 border-white shadow-md transition-all duration-300 ${isScrolled ? "w-10 h-10" : "w-14 h-14"}`}>
                <img src="https://placehold.co/100x100/e2e8f0/64748b?text=U" alt="User" className="w-full h-full object-cover" />
              </div>
            </Link>
          
            {/* dropdown when hovered */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1721] rounded-md shadow-2xl opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 flex flex-col overflow-hidden border border-[#2a2238]">
              <Link href="/profile">  
                <div className="relative h-24 w-full bg-cover bg-center" 
                  style={{ backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAGZ08KQh0HdxUUGR7gGNrsfc3NoUPrOb8mvijIW3kQi5yLZghe62ixI1r&s=10')" }}>
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                    <div className="w-8 h-8 border-2 border-white rounded-lg flex items-center justify-center rotate-45 mt-2">
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