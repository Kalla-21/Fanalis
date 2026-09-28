import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ClientBackground from "@/components/client-background";
import localFont from "next/font/local";
import { getUserProfile } from "./utils/getUser";
import "./globals.css";

const customFont = localFont({
  src: "./Torus.otf",
  display: "swap",
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
   const { user, profile } = await getUserProfile();
   
   const coverPhotoUrl = profile?.cover_photo_url || "https://i.imgur.com/VVeDHSv.jpeg";
   const coverPosition = profile?.cover_position ?? 50; 
   
  return (
    <html lang="en" className="bg-[#111111] h-full">
      <body className={`${customFont.className} flex flex-col min-h-full bg-[#111111] text-gray-200 relative`}>
        
        {/* Dynamic Client Background replaces the static img div */}
        <ClientBackground coverUrl={coverPhotoUrl} coverPosition={coverPosition} />
        
        <Navbar profile={profile} />      
        
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 mt-16 sm:mt-20 z-10">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}