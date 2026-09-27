import Image from "next/image";

const mockPosts = [
  { id: 1, title: "osu! World Cup 2026", author: "Tournament Staff", height: "h-64", img: "https://placehold.co/400x600/2a2238/ff66aa" },
  { id: 2, title: "Ranked Beatmap Updates", author: "BAT", height: "h-40", img: null },
  { id: 3, title: "New Featured Artist", author: "Peppy", height: "h-80", img: "https://placehold.co/400x800/2a2238/ff66aa" },
  { id: 4, title: "Tablet Driver Config", author: "TechSupport", height: "h-48", img: "https://placehold.co/400x400/2a2238/ff66aa" },
  { id: 5, title: "Community Tournament", author: "L A V H", height: "h-64", img: "https://placehold.co/400x600/2a2238/ff66aa" },
  { id: 6, title: "Keyboard Switches Review", author: "Guest", height: "h-72", img: "https://placehold.co/400x700/2a2238/ff66aa" },
  { id: 7, title: "Server Maintenance", author: "Admin", height: "h-32", img: null },
  { id: 8, title: "Mapping Contest Winners", author: "L A V H", height: "h-64", img: "https://placehold.co/400x600/2a2238/ff66aa" },
  { id: 9, title: "Skinning Tutorial", author: "Designer", height: "h-56", img: "https://placehold.co/400x500/2a2238/ff66aa" },
  { id: 10, title: "Upcoming PP Changes", author: "Dev Team", height: "h-48", img: null },
  { id: 11, title: "Anime OP Compilation", author: "Guest", height: "h-80", img: "https://placehold.co/400x800/2a2238/ff66aa" },
  { id: 12, title: "LAN Event Photos", author: "Photographer", height: "h-64", img: "https://placehold.co/400x600/2a2238/ff66aa" },
  { id: 13, title: "Mouse vs Tablet Debate", author: "PlayerOne", height: "h-40", img: null },
  { id: 14, title: "Stream Highlights", author: "Streamer", height: "h-72", img: "https://placehold.co/400x700/2a2238/ff66aa" },
  { id: 15, title: "Welcome to Fanalis", author: "L A V H", height: "h-64", img: "https://placehold.co/400x600/2a2238/ff66aa" },
];

export default function Home() {

  return (
    
    <div className="w-full bg-[#1a1721] p-6 rounded-lg shadow-xl border border-[#2a2238]">
      
      <div className="flex flex-col gap-1">
    <div className="flex items-center justify-center gap-2 text-gray-200 font-semibold text-lg pb-4">
      <h1>Explore different blogs and make your own!</h1>
    </div>
  </div>
  
      <div className="flex gap-6 border-b border-[#2a2238] mb-6 pb-2 px-2">
        <button className="font-bold text-[#ff66aa] border-b-2 border-[#ff66aa] pb-2 -mb-[9px]">
          News
        </button>
        <button className="font-medium text-gray-400 hover:text-gray-200 pb-2 transition-colors">
          Beatmaps
        </button>
      </div>

      <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {mockPosts.map((post) => (
          <div 
            key={post.id} 
            className="break-inside-avoid rounded-lg overflow-hidden shadow-sm bg-[#1e1929] border border-[#2a2238] hover:shadow-md hover:border-[#ff66aa] transition-all cursor-pointer group"
          >
            {post.img ? (
              <div className={`w-full ${post.height} relative bg-[#111111]`}>
                <img 
                  src={post.img} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" 
                />
              </div>
            ) : (
              <div className={`w-full ${post.height} bg-gradient-to-br from-[#2a2238] to-[#1e1929] flex items-center justify-center p-6 text-center`}>
                 <span className="font-bold text-gray-200 text-lg leading-tight line-clamp-3">
                   {post.title}
                 </span>
              </div>
            )}
            
            <div className="p-3 bg-[#1e1929]">
              <h3 className="text-sm font-semibold text-gray-200 line-clamp-1 group-hover:text-[#ff66aa] transition-colors">{post.title}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">{post.author}</span>
                <button className="text-xs text-gray-500 hover:text-[#ff66aa] transition-colors">
                  ♡
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}