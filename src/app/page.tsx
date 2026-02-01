'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';
import Quiz from '@/components/Quiz/Quiz';
import MovieCard from '@/components/MovieCard/MovieCard';
import WatchLaterList from '@/components/WatchLater/WatchLaterList';
import { useSessionStore } from '@/store/session-store';
import { Movie, QuizAnswers } from '@/lib/types';

type AppState = 'welcome' | 'quiz' | 'recommendation';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [reasons, setReasons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const {
    quizAnswers,
    setQuizAnswers,
    rejectedMovies,
    rejectMovie,
    addToWatchLater,
    recommendationCount,
    resetSession,
  } = useSessionStore();

  const currentMovie = recommendedMovies[currentMovieIndex] || null;
  const hasMoreMovies = currentMovieIndex < recommendedMovies.length - 1;


  const LOADING_MESSAGES = [
    "🎬 Wrzucam filmy na bęben...",
    "🎭 Dobieram obsadę...",
    "🎨 Przygotowuję popcorn...",
    "📽️ Ustawiam projektor...",
    "🎪 Sprawdzam co leci w kinie...",
    "🎯 Celuję w idealne dopasowanie...",
    "🔮 Konsultuję się z krytykami...",
    "🎲 Losuje z topki...",
    "🍿 Podgrzewam popcorn...",
    "🎸 Szukam najlepszego soundtracku...",
    "🌟 Przeczesuje IMDb...",
    "🎥 Nakręcam zwiastun...",
    "📚 Czytam recenzje...",
    "🎭 Przebieramy się za bohaterów...",
    "🔍 Śledzę tropy...",
    "🎬 Klapka, akcja!...",
    "🌈 Mieszam gatunki...",
    "⭐ Zliczam gwiazdki...",
    "🎪 Otwieram sezon kinowy...",
    "🎨 Maluję plakaty...",
    "📽️ Przewijam taśmę...",
    "🎯 Szukam ukrytych perełek...",
    "🍕 Zamawianie pizzy dla ekipy...",
    "🎬 Montowanie scen...",
    "🎵 Dobieranie ścieżki dźwiękowej...",
    "🏆 Sprawdzanie nagród...",
    "🎭 Czytanie scenariusza...",
    "🌟 Polerowanie Oscar'ów...",
    "📺 Sprawdzanie VOD...",
    "🎪 Rozkładanie czerwonego dywanu...",
  ];

  const fetch10Movies = async (answersToUse?: QuizAnswers) => {
    const finalAnswers = answersToUse || quizAnswers;
    
    setIsLoading(true);
    setError(null);
    
    console.log('📤 Wysyłam do API:', finalAnswers);
    
    // Animacja zmieniających się tekstów
    let messageIndex = 0;
    const randomMessages = [...LOADING_MESSAGES].sort(() => Math.random() - 0.5).slice(0, 5);
    setLoadingMessage(randomMessages[0]);
    
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % randomMessages.length;
      setLoadingMessage(randomMessages[messageIndex]);
    }, 800);

    // Delay 3-5s
    const delay = 3000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    clearInterval(messageInterval);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: finalAnswers,
          excludeIds: rejectedMovies,
          count: 10
        }),
      });

      console.log('📥 Status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('❌ Błąd API:', data);
        throw new Error(data.error || 'Nie udało się znaleźć filmów');
      }

      const data = await response.json();
      console.log('✅ Otrzymano filmy:', data.movies?.length);
      setRecommendedMovies(data.movies || []);
      setCurrentMovieIndex(0);
      setReasons(data.reasons || []);
      setAppState('recommendation');
    } catch (err) {
      console.error('💥 Error:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendation = fetch10Movies;

  const handleQuizComplete = (answers: QuizAnswers) => {
    console.log('🎯 Quiz complete, answers:', answers);
    setQuizAnswers(answers);
    setAppState('recommendation');
    fetch10Movies(answers);
  };

  const handleReject = () => {
    if (!currentMovie) return;
    
    rejectMovie(currentMovie.id);
    
    if (hasMoreMovies) {
      setCurrentMovieIndex(currentMovieIndex + 1);
    } else {
      setAppState('welcome');
      resetSession();
      setRecommendedMovies([]);
    }
  };

  const handleAccept = () => {
    if (!currentMovie) return;
    
    addToWatchLater(currentMovie);
    
    if (hasMoreMovies) {
      setCurrentMovieIndex(currentMovieIndex + 1);
    } else {
      setAppState('welcome');
      resetSession();
      setRecommendedMovies([]);
    }
  };

  const handleStartOver = () => {
    setAppState('welcome');
    resetSession();
    setRecommendedMovies([]);
    setCurrentMovieIndex(0);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <AnimatePresence mode="wait">
        {/* Welcome Screen */}
        {appState === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full">
              Szybki dobór filmu 2026
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
              Skończ z nudą. <br />
              Znajdź film w <span className="text-indigo-600 underline">30 sekund</span>.
            </h2>
            <p className="text-xl text-slate-500 mb-10 max-w-xl mx-auto">
              Nasz algorytm dopasuje film do Twojego nastroju, platformy streamingowej i tego, z kim dziś oglądasz.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAppState('quiz')}
              className="px-10 py-5 bg-indigo-600 text-white text-xl font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all mb-12"
            >
              Zacznij darmowy quiz
            </motion.button>

            {/* AdSense Placement */}
            <div className="w-full flex justify-center mb-12">
              <ins className="adsbygoogle"
                   style={{ display: 'block' }}
                   data-ad-client="ca-pub-4321819036207321"
                   data-ad-slot="9003821965"
                   data-ad-format="auto"
                   data-full-width-responsive="true"></ins>
            </div>
            <Script id="adsense-init" strategy="afterInteractive">
              {`(adsbygoogle = window.adsbygoogle || []).push({});`}
            </Script>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: '🎬', title: '15,000+ Filmów', desc: 'Największa baza rekomendacji' },
                { icon: '🤖', title: 'Smart Match', desc: 'Algorytm oparty na vibe' },
                { icon: '🍿', title: 'Zero logowania', desc: 'Wchodzisz i wybierasz' },
              ].map((feature, i) => (
                <div key={i} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quiz */}
        {appState === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="mb-8 flex justify-between items-center">
              <button onClick={() => setAppState('welcome')} className="text-slate-400 hover:text-indigo-600 font-medium">
                ← Powrót
              </button>
              <div className="text-slate-400 text-sm font-bold uppercase tracking-widest">Krok 1 z 7</div>
            </div>
            <Quiz onComplete={handleQuizComplete} />
          </motion.div>
        )}

        {/* Recommendation */}
        {/* Recommendation with loading + ambient */}
        {appState === 'recommendation' && (
          <motion.div
            key="recommendation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative"
          >
            {/* Ambient background */}
            {currentMovie?.backdrop && !isLoading && (
              <div 
                className="fixed inset-0 z-0 opacity-20"
                style={{
                  backgroundImage: `url(${currentMovie.backdrop})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(40px)',
                }}
              />
            )}
            
            <div className="relative z-10">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">🎬</div>
                  </div>
                  <p className="mt-6 text-2xl font-bold text-slate-900 animate-pulse">{loadingMessage}</p>
                  <p className="text-slate-500 mt-2">Za chwilę pokażemy Ci 10 filmów...</p>
                </div>
              ) : error ? (
                <div className="max-w-md mx-auto text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                  <div className="text-6xl mb-6">🏜️</div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Brak wyników</h3>
                  <p className="text-slate-500 mb-8 px-6">{error}</p>
                  <button
                    onClick={handleStartOver}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                  >
                    Zmień preferencje
                  </button>
                </div>
              ) : currentMovie ? (
                <div className="max-w-5xl mx-auto">
                  <div className="mb-6 text-center">
                    <p className="text-slate-600">
                      Film {currentMovieIndex + 1} z {recommendedMovies.length}
                    </p>
                  </div>
                  
                  <MovieCard
                    movie={currentMovie}
                    reasons={reasons}
                    onReject={handleReject}
                    onAccept={handleAccept}
                    onStartOver={handleStartOver}
                    hasMore={hasMoreMovies}
                  />
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watch Later Section */}
      <div id="watch-later" className="mt-32">
        <WatchLaterList />
      </div>
    </div>
  );
}