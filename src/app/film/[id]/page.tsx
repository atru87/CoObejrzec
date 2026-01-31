'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/lib/types';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function FilmPage() {
  const params = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;

    fetch(`/api/movies?id=${params.id}`)
      .then(res => res.json())
      .then(data => {
        setMovie(data.movie);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Film nie znaleziony</h2>
          <Link href="/filmy" className="text-indigo-600 hover:underline">
            Wróć do listy filmów
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Backdrop */}
      {movie.backdrop && (
        <div 
          className="h-96 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${movie.backdrop})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent"></div>
        </div>
      )}

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="md:flex">
            {/* Poster */}
            {movie.poster && (
              <div className="md:w-1/3">
                <img
                  src={movie.poster}
                  alt={movie.title_pl || movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Info */}
            <div className="md:w-2/3 p-8">
              <Link href="/filmy" className="text-indigo-600 hover:underline mb-4 inline-block">
                ← Wróć do listy
              </Link>

              <h1 className="text-4xl font-black text-gray-900 mb-2">{movie.title_pl}</h1>
              
              {movie.title_original !== movie.title_pl && (
                {movie.title_original && movie.title_original !== movie.title_pl && (
				  <p className="text-xl text-gray-500 mb-6">{movie.title_original}</p>
				)}
              )}

              <div className="flex items-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">{movie.rating}</div>
                  <div className="text-sm text-gray-500">Ocena</div>
                </div>
                {movie.year && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{movie.year}</div>
                    <div className="text-sm text-gray-500">Rok</div>
                  </div>
                )}
                {movie.runtime && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{movie.runtime}</div>
                    <div className="text-sm text-gray-500">Minuty</div>
                  </div>
                )}
              </div>

              {/* Gatunki */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Gatunki</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* Opis */}
              {movie.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Opis</h3>
                  <p className="text-gray-600 leading-relaxed">{movie.description}</p>
                </div>
              )}

              {/* Kraje */}
              {movie.countries && movie.countries.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Produkcja</h3>
                  <p className="text-gray-600">{movie.countries.join(', ')}</p>
                </div>
              )}

              {/* Keywords */}
              {movie.keywords && movie.keywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Słowa kluczowe</h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.keywords.slice(0, 10).map((keyword, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
