import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import localFont from "next/font/local";
import "./globals.css";

const customFont = localFont({
  src: "./Torus.otf",
  variable: "--apply-torus",
  display: "swap",
});


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="--apply-torus">
      <body className="--apply-torus flex flex-col min-h-screen bg-[#111111] text-gray-200 font-sans relative">
        <div className="--apply-torus absolute top-0 left-0 w-full h-[150px] -z-10">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzwDTp2yBU4Kx69wZHNEApu9_WIWEQFK2WdilDZ0Y-UtSxUBKwvbJs0awx&s=10" 
            alt="Header Background" 
            className="w-full h-full object-cover opacity-80"
          />
        </div>
        <Navbar />       
        <main className=" --apply-torus flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 mt-20 z-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}