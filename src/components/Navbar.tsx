// src/components/Navbar.tsx (lub w layout.tsx)
<nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur shadow-sm">
  <div className="container mx-auto flex h-16 items-center justify-between px-4">
    <div className="flex items-center gap-8">
      <Link href="/" className="text-2xl font-black tracking-tighter text-indigo-600">
        🎬 FILMMATCH
      </Link>
      <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
        <Link href="/quiz-osobowosciowy" className="hover:text-indigo-600 transition">Jakim filmem jesteś?</Link>
        <Link href="/rankingi" className="hover:text-indigo-600 transition">Rankingi 2026</Link>
        <Link href="/nowosci" className="hover:text-indigo-600 transition">Premiery</Link>
      </div>
    </div>
    
    <div className="flex items-center gap-4">
      {/* Przycisk Watchlist zamiast logowania */}
      <Link href="/watchlist" className="relative p-2 text-gray-600 hover:text-indigo-600 transition">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
          {watchLaterCount}
        </span>
      </Link>
    </div>
  </div>
</nav>