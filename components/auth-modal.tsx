"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
};

export default function AuthModal({ isOpen, onClose, message = "You need an account to do this." }: AuthModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="relative bg-[#1a1721] border border-[#2a2238] rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-[#2a2238] text-gray-400 hover:text-white rounded-full flex items-center justify-center transition-colors border border-white/10"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="w-14 h-14 bg-[#2a2238] rounded-full flex items-center justify-center mb-5 text-[#ff66aa] shadow-inner border border-[#3e3254]">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Authentication Required</h3>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">{message}</p>

        <div className="flex flex-col w-full gap-3">
          <button onClick={() => router.push("/login")} className="w-full bg-[#ff66aa] hover:bg-[#ff4499] text-white font-bold py-3 rounded-xl transition-all shadow-md">Log In</button>
          <button onClick={() => router.push("/signup")} className="w-full bg-transparent border border-[#3e3254] hover:border-[#ff66aa] hover:text-[#ff66aa] text-gray-300 font-bold py-3 rounded-xl transition-all">Sign Up</button>
        </div>
      </div>
    </div>,
    document.body
  );
}