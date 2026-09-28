"use client";

import { usePathname } from "next/navigation";

type BackgroundProps = {
  coverUrl: string;
  coverPosition: number;
};

export default function ClientBackground({ coverUrl, coverPosition }: BackgroundProps) {
  const pathname = usePathname();
  const isProfile = pathname === "/profile";

  return (
    <div className="absolute top-0 left-0 w-full h-[150px] z-0 pointer-events-none">
      
      {/* 1. BASE LAYER */}
      {isProfile ? (
        <div className="absolute inset-0 bg-[#2b0e1e]"></div> 
      ) : (
        <img 
          src={coverUrl} 
          alt="Header Background" 
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: `center ${coverPosition}%` }}
        />
      )}

      {/* 2. REAL TRIANGLE SHADER TEXTURE (Using your custom PNG) */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage: `url('https://i.imgur.com/RTpmOQQ.png')`,
          backgroundSize: '180px', // Adjust this value to scale your pattern up or down
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'top left',
          
          // Fades the pattern out smoothly before the bottom edge
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0px, rgba(0,0,0,0.8) 40px, rgba(0,0,0,0) 100px)',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0px, rgba(0,0,0,0.8) 40px, rgba(0,0,0,0) 100px)',
        }}
      ></div>

   
      
    </div>
  );
}