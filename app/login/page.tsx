"use client";

import { useState, useEffect } from "react";
import Form from "next/form";
import Link from "next/link";

export default function Login() {
  // React state to handle the live clock from your JSP footer
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => setTime(new Date().toLocaleTimeString());
    updateClock(); // Set initial time instantly
    const intervalId = setInterval(updateClock, 1000);
    
    // Cleanup the interval when the user leaves the page
    return () => clearInterval(intervalId); 
  }, []);

  return (
    <main className="min-h-screen flex flex-col justify-between bg-gray-50 text-gray-900 font-sans">
      
      <header className="w-full bg-blue-600 text-white py-4 px-6 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-lg">Kurt</h1>
        <h1 className="font-bold text-xl uppercase tracking-wider">Header Content</h1>
        <h1 className="font-bold text-lg">Lance</h1>
      </header>

      <div className="flex flex-col items-center justify-center flex-1 w-full px-4">
        
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Log in</h2>
          </div>

          <Form action="/api/login" className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1">
              <label htmlFor="username" className="text-sm font-semibold text-gray-700">Username:</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                placeholder="Enter username" 
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700">Password:</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="Enter password" 
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button 
              type="submit" 
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              Login
            </button>
          </Form>

          <div className="mt-4 text-center">
            <Link 
              href="/" 
              className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
            >
              Back to Welcome
            </Link>
          </div>

        </div>
      </div>

    </main>
  );
}