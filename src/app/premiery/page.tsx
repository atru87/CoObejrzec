'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/lib/types';
import Link from 'next/link';

export default function PremieryPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/movies')
      .then(res => res.json())
      .then(data => {
        const sorted = (data.movies || [])
          .filter((m: Movie) => m.year && m.year >= 2020)
          .sort((a: Movie, b: Movie) => (b.year || 0) - (a.year || 0))
          .slice(0, 50);
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
        <h1 className="text-4xl font-black text-gray-900 mb-2">🎬 Najnowsze Premiery</h1>
        <p className="text-gray-600">Top 50 najnowszych filmów w bazie</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {movies.map((movie) => (
          <Link
            key={movie.id}
            href={`/film/${movie.id}`}
            className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
          >
            {movie.poster && (
              <img
                src={movie.poster}
                alt={movie.title_pl || movie.title}
                className="w-full h-80 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{movie.title_pl || movie.title}</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-indigo-600">
                  ⭐ {parseFloat(movie.rating as any).toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">{movie.year}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {movie.genres.slice(0, 2).map((genre) => (
                  <span
                    key={genre}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
