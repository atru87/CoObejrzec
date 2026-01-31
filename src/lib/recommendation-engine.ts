import { Movie, QuizAnswers, RecommendationResult } from './types';
import { searchMovies, SearchCriteria } from './db';

/**
 * Główny algorytm rekomendacji
 * 
 * System działa w dwóch fazach:
 * 1. Filtrowanie - zawęża bazę do filmów spełniających twarde kryteria
 * 2. Scoring - przypisuje punkty za dopasowanie do preferencji
 */
export async function getRecommendation(
  answers: QuizAnswers,
  excludeIds: number[] = []
): Promise<RecommendationResult | null> {
  
  // Faza 1: Zbuduj kryteria filtrowania
  const criteria: SearchCriteria = {
    excludeIds,
    limit: 200, // Pobieramy więcej filmów do scoringu
  };
  
  // Gatunki
  if (answers.genres.length > 0 && !answers.genres.includes('any')) {
    criteria.genres = answers.genres;
  }
  
  // Era
  if (answers.era === 'old') {
    criteria.maxYear = 2000;
    criteria.minYear = 1950;
  } else if (answers.era === 'modern') {
    criteria.minYear = 2010;
  }
  
  // Pochodzenie
  if (answers.origin === 'polish') {
    criteria.isPolish = true;
  } else if (answers.origin === 'foreign') {
    criteria.isPolish = false;
  }
  
  // Ocena
  if (answers.rating === 'high') {
    criteria.minRating = 7.5;
  } else if (answers.rating === 'medium') {
    criteria.minRating = 6.0;
  }
  
  // Popularność
  if (answers.popularity === 'popular') {
    criteria.minPopularity = 50;
  } else if (answers.popularity === 'niche') {
    criteria.maxPopularity = 30;
    criteria.minRating = 7.0;
  }
  
  // Pobierz kandydatów
  const candidates = await searchMovies(criteria);
  
  if (candidates.length === 0) return null;
  
  // Faza 2: Scoring i wybór najlepszego
  return scoreAndPickBest(candidates, answers);
}

/**
 * Przypisuje punkty filmom i wybiera najlepszy
 */
function scoreAndPickBest(
  movies: Movie[],
  answers: QuizAnswers
): RecommendationResult | null {
  
  const scored = movies.map(movie => {
    let score = 0;
    const reasons: string[] = [];
    
    // Bazowy score z oceny (0-10 punktów)
    score += movie.rating;
    
    // Bonus za gatunek (5 punktów za każdy matching)
    if (answers.genres.length > 0 && !answers.genres.includes('any')) {
      const genreMatches = movie.genres.filter(g => 
        answers.genres.includes(g)
      ).length;
      
      if (genreMatches > 0) {
        score += genreMatches * 5;
        reasons.push(`Gatunek: ${movie.genres.filter(g => answers.genres.includes(g)).join(', ')}`);
      }
    }
    
    // Bonus za popularność (2 punkty)
    if (answers.popularity === 'popular' && movie.popularity > 100) {
      score += 2;
      reasons.push('Popularny tytuł');
    }
    if (answers.popularity === 'niche' && movie.popularity < 30) {
      score += 2;
      reasons.push('Niszowy klejnot');
    }
    
    // Bonus za wysoką ocenę (3 punkty za >8.0)
    if (movie.rating >= 8.0) {
      score += 3;
      reasons.push(`Wysoka ocena: ${movie.rating}/10`);
    }
    
    return {
      movie,
      score,
      reasons
    };
  });
  
  // Sortuj po score
  scored.sort((a, b) => b.score - a.score);
  
  // Dodaj element losowości - wybierz z top 10
  const topMovies = scored.slice(0, Math.min(10, scored.length));
  const randomIndex = Math.floor(Math.random() * topMovies.length);
  
  return topMovies[randomIndex] || null;
}

/**
 * Losowa rekomendacja (tryb "coś totalnie innego")
 */
export async function getRandomRecommendation(excludeIds: number[] = []): Promise<Movie | null> {
  const movies = await searchMovies({
    excludeIds,
    limit: 100,
    minRating: 6.5
  });
  
  if (movies.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * movies.length);
  return movies[randomIndex];
}

/**
 * Zwraca N rekomendacji
 */
export async function getMultipleRecommendations(
  answers: QuizAnswers,
  excludeIds: number[] = [],
  count: number = 10
): RecommendationResult[] {
  const criteria: SearchCriteria = {
    excludeIds,
    limit: count * 10,
  };
  
  if (answers.genres.length > 0 && !answers.genres.includes('any')) {
    criteria.genres = answers.genres;
  }
  
  if (answers.era === 'old') {
    criteria.maxYear = 2000;
    criteria.minYear = 1950;
  } else if (answers.era === 'modern') {
    criteria.minYear = 2010;
  }
  
  if (answers.origin === 'polish') {
    criteria.isPolish = true;
  } else if (answers.origin === 'foreign') {
    criteria.isPolish = false;
  }
  
  if (answers.rating === 'high') {
    criteria.minRating = 7.5;
  } else if (answers.rating === 'medium') {
    criteria.minRating = 6.0;
  }
  
  if (answers.popularity === 'popular') {
    criteria.minPopularity = 50;
  } else if (answers.popularity === 'niche') {
    criteria.maxPopularity = 30;
    criteria.minRating = 7.0;
  }
  
  const candidates = await searchMovies(criteria);
  if (candidates.length === 0) return [];
  
  // Score inline
  const scored = candidates.map(movie => {
    let score = 0;
    const reasons: string[] = [];
    
    // Gatunek
    if (answers.genres.length > 0 && !answers.genres.includes('any')) {
      const genreMatches = movie.genres.filter(g => answers.genres.includes(g)).length;
      if (genreMatches > 0) {
        score += genreMatches * 5;
        reasons.push(`${movie.genres.filter(g => answers.genres.includes(g)).join(', ')}`);
      }
    }
    
    // Era
    if (answers.era === 'modern' && movie.year && movie.year >= 2010) {
      score += 3;
    } else if (answers.era === 'old' && movie.year && movie.year < 2000) {
      score += 3;
    }
    
    // Ocena
    if (answers.rating === 'high' && movie.rating >= 7.5) {
      score += 5;
      reasons.push(`Wysoka ocena: ${movie.rating}/10`);
    } else if (answers.rating === 'medium' && movie.rating >= 6.0) {
      score += 3;
    }
    
    // Popularność
    if (answers.popularity === 'popular' && movie.popularity > 50) {
      score += 3;
      reasons.push('Popularny');
    } else if (answers.popularity === 'niche' && movie.popularity < 30) {
      score += 3;
      reasons.push('Ukryta perełka');
    }
    
    // Bonus za wysoką ocenę
    if (movie.rating >= 8.0) {
      score += 2;
    }
    
    return { movie, score, reasons };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, count);
}
