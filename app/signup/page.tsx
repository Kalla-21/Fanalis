"use client";

import Form from "next/form";
import Link from "next/link";
import { signupUser } from "./action"; 

export default function SignUp() {
    
  return (
    // container 
    <div className="w-full bg-[#111111] p-6 rounded-lg shadow-xl border border-[#2a2238] min-h-[80vh] flex flex-col">
      <div className="flex flex-col items-center justify-center flex-1 w-full px-4 mb-8">
       
        {/* header */}
        <div className="bg-[#1e1929] p-8 rounded-lg shadow-sm w-full max-w-md border border-[#2a2238] transition-all group">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-200 transition-colors">Sign Up</h2>
          </div>

          {/* start of form */}
          <Form action={signupUser} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-semibold text-gray-400">Username:</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                placeholder="Choose a username" 
                className="bg-[#111111] border border-[#2a2238] text-gray-200 rounded-md px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#ff66aa] focus:border-[#ff66aa] transition-colors placeholder-gray-600"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-gray-400">Email:</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="Enter email" 
                className="bg-[#111111] border border-[#2a2238] text-gray-200 rounded-md px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#ff66aa] focus:border-[#ff66aa] transition-colors placeholder-gray-600"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-gray-400">Password:</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="Create a password" 
                className="bg-[#111111] border border-[#2a2238] text-gray-200 rounded-md px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#ff66aa] focus:border-[#ff66aa] transition-colors placeholder-gray-600"
                required
              />
            </div>
           
            <button 
              type="submit" 
              className="mt-4 w-full bg-[#ff66aa] hover:bg-pink-500 text-white font-bold py-2.5 px-4 rounded-md transition-colors shadow-lg shadow-pink-500/20"
            >
              Sign Up
            </button>
          </Form>

          <div className="mt-6 text-center">
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#2a2238] to-transparent my-6"></div>
            <Link href="/login" 
              className="text-sm text-gray-500 hover:text-[#ff66aa] font-medium transition-colors"> Already have an account? Log In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}