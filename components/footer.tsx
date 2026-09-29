"use client";

import { useState, useEffect } from "react";

export default function Footer() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => setTime(new Date().toLocaleTimeString());
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    
    return () => clearInterval(intervalId); 
  }, []);

  return (
    <footer className="w-full bg-[#1a1721] text-gray-300 py-4 text-center text-sm z-10">
      <p>Developed by LAVH - {time ? `${time} PST 2026` : "Loading time..."}</p>
    </footer>
  );
}