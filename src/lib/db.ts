import Database from 'better-sqlite3';
import path from 'path';
import { Movie } from './types';

let db: Database.Database | null = null;

/**
 * Singleton połączenia z bazą danych
 */
export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'movies.db');
    db = new Database(dbPath, { readonly: true });
    db.pragma('journal_mode = WAL');
  }
  return db;
}

/**
 * Pobiera film po ID wraz z gatunkami i krajami
 */
export function getMovieById(id: number): Movie | null {
  const db = getDatabase();
  
  const movie = db.prepare(`
    SELECT * FROM movies WHERE id = ?
  `).get(id) as any;
  
  if (!movie) return null;
  
  const genres = db.prepare(`
    SELECT g.name
    FROM genres g
    JOIN movie_genres mg ON g.id = mg.genre_id
    WHERE mg.movie_id = ?
  `).all(id).map((row: any) => row.name);
  
  const countries = db.prepare(`
    SELECT c.code
    FROM countries c
    JOIN movie_countries mc ON c.id = mc.country_id
    WHERE mc.movie_id = ?
  `).all(id).map((row: any) => row.code);
  
  return {
    ...movie,
    is_polish: movie.is_polish === 1,
    genres,
    countries,
  };
}

/**
 * Wyszukuje filmy według kryteriów
 */
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

export function searchMovies(criteria: SearchCriteria): Movie[] {
  const db = getDatabase();
  
  let sql = `
    SELECT DISTINCT m.*
    FROM movies m
  `;
  
  const conditions: string[] = [];
  const params: any[] = [];
  
  // Filtrowanie po gatunkach
  if (criteria.genres && criteria.genres.length > 0) {
    sql += `
      JOIN movie_genres mg ON m.id = mg.movie_id
      JOIN genres g ON mg.genre_id = g.id
    `;
    conditions.push(`g.name IN (${criteria.genres.map(() => '?').join(',')})`);
    params.push(...criteria.genres);
  }
  
  // Filtrowanie po keywords (dla mood)
  if (criteria.keywords && criteria.keywords.length > 0) {
    sql += `
      JOIN movie_keywords mk ON m.id = mk.movie_id
      JOIN keywords k ON mk.keyword_id = k.id
    `;
    conditions.push(`k.name IN (${criteria.keywords.map(() => '?').join(',')})`);
    params.push(...criteria.keywords);
  }
  
  sql += ' WHERE 1=1 ';
  
  // Rok
  if (criteria.minYear) {
    conditions.push('m.year >= ?');
    params.push(criteria.minYear);
  }
  if (criteria.maxYear) {
    conditions.push('m.year <= ?');
    params.push(criteria.maxYear);
  }
  
  // Ocena
  if (criteria.minRating) {
    conditions.push('m.rating >= ?');
    params.push(criteria.minRating);
  }
  
  // Polski/zagraniczny
  if (criteria.isPolish !== undefined) {
    conditions.push('m.is_polish = ?');
    params.push(criteria.isPolish ? 1 : 0);
  }
  
  // Długość
  if (criteria.minRuntime) {
    conditions.push('m.runtime >= ?');
    params.push(criteria.minRuntime);
  }
  if (criteria.maxRuntime) {
    conditions.push('m.runtime <= ?');
    params.push(criteria.maxRuntime);
  }
  
  // Popularność
  if (criteria.minPopularity) {
    conditions.push('m.popularity >= ?');
    params.push(criteria.minPopularity);
  }
  if (criteria.maxPopularity) {
    conditions.push('m.popularity <= ?');
    params.push(criteria.maxPopularity);
  }
  
  // Wyklucz filmy
  if (criteria.excludeIds && criteria.excludeIds.length > 0) {
    conditions.push(`m.id NOT IN (${criteria.excludeIds.map(() => '?').join(',')})`);
    params.push(...criteria.excludeIds);
  }
  
  // Dodaj warunki
  if (conditions.length > 0) {
    sql += ' AND ' + conditions.join(' AND ');
  }
  
  // Sortowanie i limit
  sql += ' ORDER BY m.rating DESC, m.popularity DESC';
  sql += ` LIMIT ${criteria.limit || 100}`;
  
  const rows = db.prepare(sql).all(...params) as any[];
  
  // Pobierz gatunki i kraje dla każdego filmu
  return rows.map(row => {
    const genres = db.prepare(`
      SELECT g.name
      FROM genres g
      JOIN movie_genres mg ON g.id = mg.genre_id
      WHERE mg.movie_id = ?
    `).all(row.id).map((r: any) => r.name);
    
    const countries = db.prepare(`
      SELECT c.code
      FROM countries c
      JOIN movie_countries mc ON c.id = mc.country_id
      WHERE mc.movie_id = ?
    `).all(row.id).map((r: any) => r.code);
    
    return {
      ...row,
      is_polish: row.is_polish === 1,
      genres,
      countries,
    };
  });
}

/**
 * Pobiera losowy film spełniający kryteria
 */
export function getRandomMovie(criteria: SearchCriteria): Movie | null {
  const movies = searchMovies({ ...criteria, limit: 50 });
  if (movies.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * movies.length);
  return movies[randomIndex];
}

/**
 * Pobiera wszystkie dostępne gatunki
 */
export function getAllGenres(): string[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT name FROM genres ORDER BY name
  `).all() as any[];
  
  return rows.map(row => row.name);
}

/**
 * Statystyki bazy
 */
export function getDatabaseStats() {
  const db = getDatabase();
  
  return {
    totalMovies: db.prepare('SELECT COUNT(*) as count FROM movies').get() as { count: number },
    avgRating: db.prepare('SELECT AVG(rating) as avg FROM movies').get() as { avg: number },
    genreCount: db.prepare('SELECT COUNT(*) as count FROM genres').get() as { count: number },
  };
}
