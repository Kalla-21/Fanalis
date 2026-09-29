import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
      
      {/* THE CONTAINER */}
      <div className="w-full bg-[#1a1721] rounded-2xl shadow-2xl border border-[#2a2238] overflow-hidden relative">
        
        {/* THE COVER */}
        <div className="relative w-full h-[280px] bg-[#2b0e1e]">
          {/* Triangle Texture */}
          <div 
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: `url('https://i.imgur.com/RTpmOQQ.png')`,
              backgroundSize: '180px',
              backgroundRepeat: 'repeat',
              backgroundPosition: 'top left',
            }}
          ></div>
          {/* Gradient fade into the container background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1721] via-[#1a1721]/60 to-transparent"></div>
          
          {/* Hero Text locked inside the cover */}
          <div className="absolute bottom-10 left-0 w-full text-center z-10 px-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter drop-shadow-lg mb-3">
              about <span className="text-[#ff66aa]">fanalis!</span>
            </h1>
            <p className="text-base text-gray-300 max-w-2xl mx-auto drop-shadow-md">
              A content hub built for creators. Explore different blogs and make your own!
            </p>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              Initially made as a dev challenge for entry into AWS-UST Tech Commitee - Dev Team
            </p>
          </div>
        </div>

        {/* THE CONTENT */}
        <div className="p-6 sm:p-10 flex flex-col gap-8 max-w-4xl mx-auto w-full">
          
          {/* Section 1: The Vision */}
          <section className="bg-[#211c2c] border border-[#2a2238] rounded-2xl p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              <span className="text-[#735ab0]"></span> Origin
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4 text-sm sm:text-base">
              Fanalis was made as a blogging website with heavy inspiration from the osu! website as well as notable features found in other online manga/manhwa websites. The design choice of the grid was taken from rednote and pinterest to have a unique non-symetric grid.
            </p>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              This was made with the hopes of elevating the developer's knowledge in the usage of newer, more modern technologies such as Next.js for the main framework, paired with Tailwind CSS for rapid design, and Supabase as the main database. Deployed on Vercel.
            </p>
          </section>

          {/* Section 3: The Developer & Tech Stack */}
          <section className="bg-transparent border border-[#2a2238] rounded-2xl p-8 border-dashed flex flex-col sm:flex-row items-center justify-between gap-8 mt-4">
            <div>
              <h2 className="text-xl font-bold text-gray-200 mb-3">Under the Hood</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                Fanalis is actively developed by Lance Herrera, a computer science student from the University of Santo Tomas, Philippines.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#2a2238] text-gray-300 rounded-full text-[10px] font-semibold tracking-wider">NEXT.JS 15</span>
                <span className="px-3 py-1 bg-[#2a2238] text-gray-300 rounded-full text-[10px] font-semibold tracking-wider">REACT</span>
                <span className="px-3 py-1 bg-[#2a2238] text-gray-300 rounded-full text-[10px] font-semibold tracking-wider">TAILWIND</span>
                <span className="px-3 py-1 bg-[#2a2238] text-gray-300 rounded-full text-[10px] font-semibold tracking-wider">SUPABASE</span>
              </div>
            </div>
            
            {/* GitHub Link */}
            <a 
              href="https://github.com/Kalla-21" 
              target="_blank" 
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-3 bg-[#211c2c] hover:bg-[#2a2238] border border-[#3e3254] hover:border-[#735ab0] text-gray-200 hover:text-white py-3 px-6 rounded-xl transition-all shadow-md group"
            >
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              <span className="font-bold tracking-tight">Kalla-21</span>
            </a>
          </section>
          
          {/* CALL TO ACTION */}
          <div className="mt-8 mb-4 text-center">
            <h2 className="text-xl font-bold text-gray-200 mb-6">Ready to start writing?</h2>
            <Link href="/signup" className="inline-flex items-center justify-center bg-[#735ab0] hover:bg-[#ff66aa] text-white font-bold py-3 px-10 rounded-xl transition-all shadow-lg hover:shadow-[#ff66aa]/20 hover:-translate-y-1">
              Join the Community
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}