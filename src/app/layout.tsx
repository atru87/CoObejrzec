import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'MatchFilm.pl - Nie trać czasu na szukanie, zacznij oglądać',
  description: 'Inteligentny dobór filmów na wieczór. Rozwiąż quiz i sprawdź, co dziś obejrzeć na Netflix, HBO i w kinie.',
  keywords: ['filmy', 'rekomendacje', 'co obejrzeć', 'matchfilm', 'quiz filmowy', 'ranking filmów'],
  authors: [{ name: 'MatchFilm.pl' }],
  openGraph: {
    title: 'MatchFilm.pl - Twój osobisty doradca filmowy',
    description: 'Rozwiąż quiz i znajdź idealny film w 30 sekund!',
    type: 'website',
    url: 'https://matchfilm.pl',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="scroll-smooth">
      <head>
        {/* Google AdSense - Twój identyfikator */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4321819036207321"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.className} bg-[#f8fafc] text-slate-900 antialiased`}>
        {/* Nawigacja nastawiona na konwersję i SEO */}
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-2 text-2xl font-black tracking-tighter text-indigo-600">
                <span className="bg-indigo-600 text-white px-2 py-1 rounded-lg">M</span>
                MATCHFILM<span className="text-slate-400">.pl</span>
              </Link>
              
              <div className="hidden lg:flex gap-8 text-sm font-bold uppercase tracking-wider text-slate-500">
                <Link href="/" className="hover:text-indigo-600 transition-colors">
                  Co obejrzeć?
                </Link>
                <Link href="/quiz-osobowosciowy" className="hover:text-indigo-600 transition-colors text-pink-500">
                  🔥 Jakim filmem jesteś?
                </Link>
                <Link href="/rankingi" className="hover:text-indigo-600 transition-colors">
                  TOP 100
                </Link>
                <Link href="/premiery" className="hover:text-indigo-600 transition-colors">
                  Premiery
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-5">
              {/* Przycisk Watchlist - anonimowy, bez logowania */}
              <Link 
                href="/#watch-later" 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-medium text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="hidden sm:inline">Moja Lista</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Miejsce na górny baner reklamowy (AdSense) */}
        <div className="container mx-auto px-4 py-4 flex justify-center overflow-hidden">
          <div className="w-full max-w-[728px] h-[90px] bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-xs rounded border border-dashed border-slate-300">
            Miejsce na reklamę (Header)
          </div>
        </div>

        <main className="min-h-[calc(100-200px)]">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 mt-20 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="col-span-1 md:col-span-2">
                <div className="text-xl font-black text-indigo-600 mb-4">MATCHFILM.pl</div>
                <p className="text-slate-500 max-w-sm">
                  Codziennie pomagamy tysiącom ludzi znaleźć idealny film na wieczór. 
                  Nasz inteligentny algorytm analizuje bazę 15,000+ tytułów, abyś Ty nie musiał.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Odkrywaj</h4>
                <ul className="space-y-2 text-slate-500 text-sm">
                  <li><Link href="/rankingi" className="hover:text-indigo-600">Najlepsze horrory 2026</Link></li>
                  <li><Link href="/rankingi" className="hover:text-indigo-600">Komedie na wieczór</Link></li>
                  <li><Link href="/rankingi" className="hover:text-indigo-600">Ranking Netflix</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Informacje</h4>
                <ul className="space-y-2 text-slate-500 text-sm">
                  <li><Link href="/polityka-prywatnosci" className="hover:text-indigo-600">Polityka prywatności</Link></li>
                  <li><Link href="/kontakt" className="hover:text-indigo-600">Kontakt</Link></li>
                  <li><span className="text-xs">Dane dostarcza TMDb API</span></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-100 mt-12 pt-8 text-center text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} MatchFilm.pl. Wszelkie prawa zastrzeżone.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}