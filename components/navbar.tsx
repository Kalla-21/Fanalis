"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
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
        className={`fixed top-0 w-full z-50 transition-all duration-450 ${
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
              <Link href="/" className="hover:text-pink-300 transition-colors">home</Link>
              <Link href="settings" className="hover:text-pink-300 transition-colors">settings</Link>
              <Link href="about" className="hover:text-pink-300 transition-colors">about</Link>
            </nav>
          </div>

          <div className="flex gap-4 items-center">
            <div className={`flex gap-2 text-white/80 font-bold drop-shadow-md transition-all duration-300 ${isScrolled ? "text-sm" : "text-base"}`}>
               <Link href="login" className="hover:text-pink-300 transition-colors">Login</Link>
            </div>
            
            <div className={`rounded-full bg-gray-500 overflow-hidden border-2 border-white shadow-md transition-all duration-300 ${isScrolled ? "w-12 h-12" : "w-14.5 h-14.5"}`}>
              <img src="https://placehold.co/100x100/e2e8f0/64748b?text=U" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>

        </div>
      </header>
    </>
  );
}