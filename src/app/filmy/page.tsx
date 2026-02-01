'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/lib/types';
import Link from 'next/link';

export default function FilmyPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/movies')
      .then(res => res.json())
      .then(data => {
        const sorted = (data.movies || []).sort((a: Movie, b: Movie) => 
          (a.title_pl || a.title).localeCompare(b.title_pl || b.title, 'pl')
        );
        setMovies(sorted);
        setFilteredMovies(sorted);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (search) {
      const result = movies.filter(m => 
        (m.title_pl || m.title).toLowerCase().includes(search.toLowerCase()) ||
        (m.title_original || m.title).toLowerCase().includes(search.toLowerCase())
      );
      setFilteredMovies(result);
    } else {
      setFilteredMovies(movies);
    }
  }, [search, movies]);

  // Grupowanie po pierwszej literze
  const groupedMovies: { [key: string]: Movie[] } = {};
  filteredMovies.forEach(movie => {
    const firstLetter = (movie.title_pl || movie.title)[0].toUpperCase();
    if (!groupedMovies[firstLetter]) {
      groupedMovies[firstLetter] = [];
    }
    groupedMovies[firstLetter].push(movie);
  });

  const letters = Object.keys(groupedMovies).sort((a, b) => a.localeCompare(b, 'pl'));

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
        <h1 className="text-4xl font-black text-gray-900 mb-2">Baza Filmów A-Z</h1>
        <p className="text-gray-600">{movies.length} filmów w bazie</p>
      </div>

      {/* Wyszukiwarka */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 sticky top-0 z-10">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj filmu..."
          className="w-full px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Nawigacja literowa */}
      <div className="flex flex-wrap gap-2 mb-8 sticky top-24 bg-white p-4 rounded-xl shadow-sm border z-10">
        {letters.map(letter => (
          <a
            key={letter}
            href={`#letter-${letter}`}
            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-bold hover:bg-indigo-600 hover:text-white transition-colors"
          >
            {letter}
          </a>
        ))}
      </div>

      {/* Lista alfabetyczna */}
      <div className="space-y-8">
        {letters.map(letter => (
          <div key={letter} id={`letter-${letter}`}>
            <h2 className="text-3xl font-black text-gray-900 mb-4 border-b-4 border-indigo-600 pb-2">
              {letter}
            </h2>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <ul className="space-y-2">
                {groupedMovies[letter].map(movie => (
                  <li key={movie.id} className="border-b border-gray-100 last:border-0 py-2">
                    <Link 
                      href={`/film/${movie.id}`}
                      className="flex items-center justify-between hover:text-indigo-600 transition-colors group"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 group-hover:text-indigo-600">
                          {movie.title_pl || movie.title}
                        </span>
                        {movie.title_original && movie.title_original !== movie.title_pl && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({movie.title_original})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">{movie.year}</span>
                        <span className="font-bold text-indigo-600">
                          ⭐ {parseFloat(movie.rating as any).toFixed(1)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
