import { NextRequest, NextResponse } from 'next/server';
import { getMovieById, searchMovies, getAllGenres, getDatabaseStats } from '@/lib/db';

/**
 * GET /api/movies?id=123
 * Pobiera film po ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    // Pobierz wszystkie gatunki
    if (action === 'genres') {
      const genres = getAllGenres();
      return NextResponse.json({ genres });
    }

    // Statystyki bazy
    if (action === 'stats') {
      const stats = getDatabaseStats();
      return NextResponse.json(stats);
    }

    // Pobierz film po ID
    if (id) {
      const movie = await getMovieById(parseInt(id));
      
      if (!movie) {
        return NextResponse.json(
          { error: 'Movie not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ movie });
    }

    // Wyszukiwanie filmów
    const genres = searchParams.get('genres')?.split(',').filter(Boolean);
    const minYear = searchParams.get('minYear');
    const maxYear = searchParams.get('maxYear');
    const minRating = searchParams.get('minRating');

    const movies = await searchMovies({
      genres,
      minYear: minYear ? parseInt(minYear) : undefined,
      maxYear: maxYear ? parseInt(maxYear) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      limit: 10000
    });

    return NextResponse.json({ movies, count: movies.length });

  } catch (error) {
    console.error('Movies API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
