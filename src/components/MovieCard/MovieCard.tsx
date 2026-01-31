'use client';

import { motion } from 'framer-motion';
import { Movie } from '@/lib/types';
import Image from 'next/image';

interface MovieCardProps {
  movie: Movie;
  reasons?: string[];
  onReject: () => void;
  onAccept: () => void;
  onStartOver: () => void;
  hasMore: boolean;
}

export default function MovieCard({ 
  movie, 
  reasons = [], 
  onReject, 
  onAccept,
  onStartOver,
  hasMore
}: MovieCardProps) {
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="md:flex">
          {/* Poster */}
          <div className="md:w-2/5 relative aspect-[2/3] md:aspect-auto">
            {movie.poster ? (
              <img
                src={movie.poster}
                alt={movie.title_pl || movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 
                           flex items-center justify-center">
                <span className="text-6xl">🎬</span>
              </div>
            )}
            
            {/* Rating badge */}
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm 
                         px-3 py-1.5 rounded-full flex items-center gap-1">
              <span className="text-yellow-400 text-lg">⭐</span>
              <span className="text-white font-bold">{parseFloat(movie.rating as any).toFixed(1)}</span>
            </div>
          </div>

          {/* Content */}
          <div className="md:w-3/5 p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {movie.title_pl || movie.title}
                </h1>
                {movie.title_pl && movie.title_original !== movie.title_pl && (
                  <p className="text-gray-500 text-sm italic">
                    {movie.title_original}
                  </p>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.year && (
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                  {movie.year}
                </span>
              )}
              {movie.runtime && (
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                  {movie.runtime} min
                </span>
              )}
              {movie.is_polish && (
                <span className="px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-700">
                  🇵🇱 Polski
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres.slice(0, 4).map((genre) => (
                <span 
                  key={genre}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed mb-6 line-clamp-4">
              {movie.description}
            </p>

            {/* Reasons */}
            {reasons.length > 0 && (
              <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  💡 Dlaczego polecamy:
                </h3>
                <ul className="space-y-1">
                  {reasons.slice(0, 4).map((reason, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-primary-500 mr-2">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onReject}
                className="flex-1 px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl 
                         hover:border-red-400 hover:bg-red-50
                         transition-all duration-200 font-medium"
              >
                👎 Nie podoba mi się
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAccept}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 
                         text-white rounded-xl font-medium
                         hover:from-green-600 hover:to-green-700
                         transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                ✅ Dodaj do listy
              </motion.button>
            </div>

            {/* Start Over when no more */}
            {!hasMore && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartOver}
                className="w-full mt-4 px-6 py-3 border-2 border-indigo-300 
                         text-indigo-600 rounded-xl font-medium
                         hover:bg-indigo-50 transition-all duration-200"
              >
                🔄 Zacznij od nowa
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
