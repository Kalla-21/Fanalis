  "use client";
  
  import { useState, useEffect } from "react";
  import Form from "next/form";
  import Link from "next/link";
  
  export default function Footer() {
    const [time, setTime] = useState("");
  
    useEffect(() => {
      const updateClock = () => setTime(new Date().toLocaleTimeString());
      updateClock();
      const intervalId = setInterval(updateClock, 1000);
      
      return () => clearInterval(intervalId); 
    }, []);
   return (
     <footer className="flex-1 flex flex-col w-full bg-gray-800 text-gray-300 py-4 text-center text-sm">
         <p>Made by Lance Herrera - {time ? `${time} PST 2026` : "Loading time..."}</p>
      </footer>
       );
}