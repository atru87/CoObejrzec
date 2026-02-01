'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '@/lib/types';
import { useSessionStore } from '@/store/session-store';

export default function WatchLaterList() {
  const { watchLater, removeFromWatchLater } = useSessionStore();

  if (watchLater.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 w-96 max-h-[500px] bg-white rounded-2xl shadow-2xl 
               overflow-hidden border border-gray-200 z-50"
    >
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
        <h3 className="text-white font-bold text-lg">
          📝 Lista do obejrzenia ({watchLater.length})
        </h3>
      </div>

      <div className="overflow-y-auto max-h-[400px] p-4 space-y-3">
        <AnimatePresence>
          {watchLater.map((movie) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 
                       transition-colors duration-200 group"
            >
              {movie.poster ? (
                <img
                  src={movie.poster}
                  alt={movie.title_pl || movie.title}
                  className="w-16 h-24 object-cover rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-16 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎬</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">
                  {movie.title_pl || movie.title}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {movie.year} • ⭐ {parseFloat(movie.rating as any).toFixed(1)}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {movie.genres.slice(0, 2).map((genre) => (
                    <span 
                      key={genre}
                      className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => removeFromWatchLater(movie.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                         text-red-500 hover:text-red-700 p-2"
                title="Usuń z listy"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Lista jest zapisywana lokalnie
        </p>
      </div>
    </motion.div>
  );
}
