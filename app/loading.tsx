export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Animated spinner */}
          <div className="absolute inset-0 rounded-full border-4 border-green-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 animate-spin"></div>
          
          {/* Inner pulse */}
          <div className="absolute inset-3 rounded-full bg-green-500/10 animate-pulse"></div>
        </div>
        
        <h2 className="text-xl font-semibold text-white mb-2">Loading LinePointer</h2>
        <p className="text-gray-400 text-sm">Sharp Lines. Smart Bets.</p>
      </div>
    </div>
  );
}

