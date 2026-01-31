'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/lib/types';
import Link from 'next/link';

export default function RankingPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/movies')
      .then(res => res.json())
      .then(data => {
        const sorted = (data.movies || [])
          .sort((a: Movie, b: Movie) => parseFloat(b.rating as any) - parseFloat(a.rating as any))
          .slice(0, 100);
        setMovies(sorted);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">🏆 TOP 100 Filmów</h1>
        <p className="text-gray-600">Najlepiej oceniane filmy w naszej bazie</p>
      </div>

      <div className="grid gap-4">
        {movies.map((movie, index) => (
          <Link
            key={movie.id}
            href={`/film/${movie.id}`}
            className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white font-black text-xl rounded-lg flex-shrink-0">
              #{index + 1}
            </div>
            {movie.poster && (
              <img
                src={movie.poster}
                alt={movie.title_pl || movie.title}
                className="w-20 h-30 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{movie.title_pl || movie.title}</h3>
              {movie.title_original && movie.title_original !== movie.title_pl && (
                <p className="text-sm text-gray-500">{movie.title_original}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-lg font-bold text-indigo-600">
                  ⭐ {parseFloat(movie.rating as any).toFixed(1)}/10
                </span>
                {movie.year && (
                  <span className="text-sm text-gray-500">{movie.year}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
