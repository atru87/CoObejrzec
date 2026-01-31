import { sql } from '@vercel/postgres';
import { Movie } from './types';

export interface SearchCriteria {
  genres?: string[];
  minYear?: number;
  maxYear?: number;
  minRating?: number;
  isPolish?: boolean;
  minRuntime?: number;
  maxRuntime?: number;
  minPopularity?: number;
  maxPopularity?: number;
  excludeIds?: number[];
  limit?: number;
  keywords?: string[];
}

/**
 * Pobiera film po ID
 */
export async function getMovieById(id: number): Promise<Movie | null> {
  try {
    const { rows } = await sql`
      SELECT 
        m.*,
        ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) as genres,
        ARRAY_AGG(DISTINCT c.code) FILTER (WHERE c.code IS NOT NULL) as countries
      FROM movies m
      LEFT JOIN movie_genres mg ON m.id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.id
      LEFT JOIN movie_countries mc ON m.id = mc.movie_id
      LEFT JOIN countries c ON mc.country_id = c.id
      WHERE m.id = ${id}
      GROUP BY m.id
    `;

    if (rows.length === 0) return null;

    const movie = rows[0];
    return {
      ...movie,
      is_polish: movie.is_polish,
      genres: movie.genres || [],
      countries: movie.countries || [],
    } as Movie;
  } catch (error) {
    console.error('Error fetching movie:', error);
    return null;
  }
}

/**
 * Wyszukuje filmy według kryteriów
 */
export async function searchMovies(criteria: SearchCriteria): Promise<Movie[]> {
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Base query - filtruj na poziomie movies
    let baseWhere = '';
    
    // Rok
    if (criteria.minYear) {
      conditions.push(`m.year >= $${paramIndex++}`);
      params.push(criteria.minYear);
    }
    if (criteria.maxYear) {
      conditions.push(`m.year <= $${paramIndex++}`);
      params.push(criteria.maxYear);
    }

    // Ocena
    if (criteria.minRating) {
      conditions.push(`m.rating >= $${paramIndex++}`);
      params.push(criteria.minRating);
    }

    // Polski/zagraniczny
    if (criteria.isPolish !== undefined) {
      conditions.push(`m.is_polish = $${paramIndex++}`);
      params.push(criteria.isPolish);
    }

    // Długość
    if (criteria.minRuntime) {
      conditions.push(`m.runtime >= $${paramIndex++}`);
      params.push(criteria.minRuntime);
    }
    if (criteria.maxRuntime) {
      conditions.push(`m.runtime <= $${paramIndex++}`);
      params.push(criteria.maxRuntime);
    }

    // Popularność
    if (criteria.minPopularity) {
      conditions.push(`m.popularity >= $${paramIndex++}`);
      params.push(criteria.minPopularity);
    }
    if (criteria.maxPopularity) {
      conditions.push(`m.popularity <= $${paramIndex++}`);
      params.push(criteria.maxPopularity);
    }

    // Wyklucz filmy
    if (criteria.excludeIds && criteria.excludeIds.length > 0) {
      const placeholders = criteria.excludeIds.map(() => `$${paramIndex++}`).join(',');
      conditions.push(`m.id NOT IN (${placeholders})`);
      params.push(...criteria.excludeIds);
    }

    if (conditions.length > 0) {
      baseWhere = ' WHERE ' + conditions.join(' AND ');
    }

    // Jeśli są gatunki do filtrowania
    if (criteria.genres && criteria.genres.length > 0 && !criteria.genres.includes('any')) {
      const genrePlaceholders = criteria.genres.map(() => `$${paramIndex++}`).join(',');
      params.push(...criteria.genres);

      const query = `
        SELECT DISTINCT
          m.*,
          ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) as genres,
          ARRAY_AGG(DISTINCT c.code) FILTER (WHERE c.code IS NOT NULL) as countries
        FROM movies m
        INNER JOIN movie_genres mg ON m.id = mg.movie_id
        INNER JOIN genres g ON mg.genre_id = g.id AND g.name IN (${genrePlaceholders})
        LEFT JOIN movie_countries mc ON m.id = mc.movie_id
        LEFT JOIN countries c ON mc.country_id = c.id
        ${baseWhere}
        GROUP BY m.id
        ORDER BY m.rating DESC, m.popularity DESC
        LIMIT $${paramIndex}
      `;
      params.push(criteria.limit || 100);

      const { rows } = await sql.query(query, params);
      return rows.map((row: any) => ({
        ...row,
        is_polish: row.is_polish,
        genres: row.genres || [],
        countries: row.countries || [],
      } as Movie));
    } else {
      // Bez filtrowania gatunków
      const query = `
        SELECT DISTINCT
          m.*,
          ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) as genres,
          ARRAY_AGG(DISTINCT c.code) FILTER (WHERE c.code IS NOT NULL) as countries
        FROM movies m
        LEFT JOIN movie_genres mg ON m.id = mg.movie_id
        LEFT JOIN genres g ON mg.genre_id = g.id
        LEFT JOIN movie_countries mc ON m.id = mc.movie_id
        LEFT JOIN countries c ON mc.country_id = c.id
        ${baseWhere}
        GROUP BY m.id
        ORDER BY m.rating DESC, m.popularity DESC
        LIMIT $${paramIndex}
      `;
      params.push(criteria.limit || 100);

      const { rows } = await sql.query(query, params);
      return rows.map((row: any) => ({
        ...row,
        is_polish: row.is_polish,
        genres: row.genres || [],
        countries: row.countries || [],
      } as Movie));
    }
  } catch (error) {
    console.error('Error searching movies:', error);
    return [];
  }
}

/**
 * Pobiera losowy film
 */
export async function getRandomMovie(criteria: SearchCriteria): Promise<Movie | null> {
  const movies = await searchMovies({ ...criteria, limit: 50 });
  if (movies.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * movies.length);
  return movies[randomIndex];
}

/**
 * Pobiera wszystkie gatunki
 */
export async function getAllGenres(): Promise<string[]> {
  try {
    const { rows } = await sql`
      SELECT name FROM genres ORDER BY name
    `;
    return rows.map((row: any) => row.name);
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
}

/**
 * Statystyki bazy
 */
export async function getDatabaseStats() {
  try {
    const { rows: movieCount } = await sql`SELECT COUNT(*) as count FROM movies`;
    const { rows: avgRating } = await sql`SELECT AVG(rating) as avg FROM movies`;
    const { rows: genreCount } = await sql`SELECT COUNT(*) as count FROM genres`;

    return {
      totalMovies: movieCount[0],
      avgRating: avgRating[0],
      genreCount: genreCount[0],
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalMovies: { count: 0 },
      avgRating: { avg: 0 },
      genreCount: { count: 0 },
    };
  }
}