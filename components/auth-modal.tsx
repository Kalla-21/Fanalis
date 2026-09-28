"use client";

import Link from "next/link";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
};

export default function AuthModal({ isOpen, onClose, message = "You need an account to do this." }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-[#1a1721] border border-[#2a2238] rounded-xl p-6 md:p-8 shadow-2xl z-10 max-w-sm w-full text-center flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Hold up!</h2>
        <p className="text-gray-400 text-sm mb-4">{message}</p>
        
        <div className="flex flex-col gap-3 mt-2">
          <Link 
            href="/signup" 
            onClick={onClose}
            className="w-full bg-[#ff66aa] hover:bg-[#ff4499] text-white font-bold py-2.5 rounded-md transition-all shadow-md"
          >
            Create an Account
          </Link>
          <Link 
            href="/login" 
            onClick={onClose}
            className="w-full bg-[#2a2238] hover:bg-[#3e3254] text-white font-bold py-2.5 rounded-md transition-all shadow-md"
          >
            Log In
          </Link>
          <button 
            onClick={onClose} 
            className="mt-2 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}