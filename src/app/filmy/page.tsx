'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/lib/types';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function FilmyPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'title' | 'rating' | 'year'>('title');

  useEffect(() => {
    // Zlicz wizytę
    fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 'filmy' })
    });

    // Pobierz filmy
    fetch('/api/movies')
      .then(res => res.json())
      .then(data => {
        setMovies(data.movies || []);
        setFilteredMovies(data.movies || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = [...movies];

    // Filtruj
    if (search) {
      result = result.filter(m => 
        (m.title_pl || m.title).toLowerCase().includes(search.toLowerCase()) ||
        (m.title_original || m.title).toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sortuj
    result.sort((a, b) => {
      if (sortBy === 'title') return (a.title_pl || a.title).localeCompare(b.title_pl || b.title, 'pl');
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'year') return (b.year || 0) - (a.year || 0);
      return 0;
    });

    setFilteredMovies(result);
  }, [search, sortBy, movies]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie bazy filmów...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Baza Filmów</h1>
        <p className="text-gray-600">Przeglądaj {movies.length} filmów w naszej bazie</p>
      </div>

      {/* Filtry */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Szukaj</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Wpisz tytuł filmu..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sortuj według</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="title">Alfabetycznie</option>
              <option value="rating">Najwyżej oceniane</option>
              <option value="year">Najnowsze</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista filmów */}
      <div className="grid gap-4">
        {filteredMovies.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nie znaleziono filmów
          </div>
        ) : (
          filteredMovies.map((movie) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
            >
              <Link href={`/film/${movie.id}`} className="flex gap-4 p-4">
                {movie.poster && (
                  <img
                    src={movie.poster}
                    alt={movie.title_pl || movie.title}
                    className="w-24 h-36 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{movie.title_pl || movie.title}</h3>
                  {movie.title_original && movie.title_original !== movie.title_pl && (
                    <p className="text-sm text-gray-500 mb-2">{movie.title_original}</p>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-indigo-600">
                      ⭐ {movie.rating}/10
                    </span>
                    {movie.year && (
                      <span className="text-sm text-gray-500">{movie.year}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {movie.genres.slice(0, 3).map((genre) => (
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
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}