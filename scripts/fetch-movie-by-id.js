/**
 * Skrypt do pobierania pojedynczego filmu po ID
 * 
 * Użycie:
 * node scripts/fetch-movie-by-id.js <movie_id> [movie_id2] [movie_id3] ...
 * 
 * Przykłady:
 * node scripts/fetch-movie-by-id.js 550
 * node scripts/fetch-movie-by-id.js 550 680 120
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const DATA_DIR = path.join(__dirname, '..', 'data');
const BATCHES_DIR = path.join(DATA_DIR, 'batches');

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        console.log(`⚠️  Rate limit! Czekam ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = 1000 * (i + 1);
      console.log(`   Retry ${i + 1}/${retries} (${delay}ms)`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function getMovieDetails(movieId) {
  const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=pl-PL&append_to_response=credits,keywords`;
  return fetchWithRetry(url);
}

async function fetchMovieById(movieId) {
  console.log(`\n🎬 Pobieram film ID: ${movieId}...`);
  
  try {
    const details = await getMovieDetails(movieId);
    
    const movie = {
      id: details.id,
      title: details.title,
      title_pl: details.title,
      title_original: details.original_title,
      description: details.overview,
      poster: details.poster_path ? `${IMAGE_BASE}${details.poster_path}` : null,
      backdrop: details.backdrop_path ? `${IMAGE_BASE}${details.backdrop_path}` : null,
      genres: details.genres.map(g => g.name),
      genre_ids: details.genres.map(g => g.id),
      year: details.release_date ? parseInt(details.release_date.split('-')[0]) : null,
      rating: Math.round(details.vote_average * 10) / 10,
      vote_count: details.vote_count,
      popularity: Math.round(details.popularity),
      countries: details.production_countries?.map(c => c.iso_3166_1) || [],
      runtime: details.runtime,
      keywords: details.keywords?.keywords?.slice(0, 10).map(k => k.name) || []
    };
    
    console.log(`✅ "${movie.title_pl}" (${movie.year}) - ${movie.rating}/10`);
    return movie;
    
  } catch (error) {
    console.error(`❌ Błąd: ${error.message}`);
    return null;
  }
}

function loadExistingMovies() {
  const moviesMap = new Map();
  
  if (!fs.existsSync(BATCHES_DIR)) {
    return moviesMap;
  }
  
  const batchFiles = fs.readdirSync(BATCHES_DIR)
    .filter(f => f.startsWith('movies_') && f.endsWith('.json'))
    .sort();
  
  for (const batchFile of batchFiles) {
    const batchPath = path.join(BATCHES_DIR, batchFile);
    const movies = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
    movies.forEach(m => moviesMap.set(m.id, m));
  }
  
  return moviesMap;
}

function saveToBatch(movies) {
  if (!fs.existsSync(BATCHES_DIR)) {
    fs.mkdirSync(BATCHES_DIR, { recursive: true });
  }
  
  // Dodaj do pliku manual-fetched
  const manualPath = path.join(BATCHES_DIR, 'movies_manual.json');
  let manualMovies = [];
  
  if (fs.existsSync(manualPath)) {
    manualMovies = JSON.parse(fs.readFileSync(manualPath, 'utf-8'));
  }
  
  // Dodaj nowe, unikaj duplikatów
  const existingIds = new Set(manualMovies.map(m => m.id));
  movies.forEach(m => {
    if (m && !existingIds.has(m.id)) {
      manualMovies.push(m);
    }
  });
  
  fs.writeFileSync(manualPath, JSON.stringify(manualMovies, null, 2));
  console.log(`\n💾 Zapisano do: ${manualPath}`);
}

function generateConsolidatedFile() {
  console.log('\n📦 Regeneruję movies-raw.json...');
  
  const allMovies = Array.from(loadExistingMovies().values());
  const outputPath = path.join(DATA_DIR, 'movies-raw.json');
  fs.writeFileSync(outputPath, JSON.stringify(allMovies, null, 2));
  
  console.log(`✅ Zapisano ${allMovies.length} filmów do movies-raw.json`);
}

// Main
async function main() {
  if (!API_KEY) {
    console.error('❌ Brak TMDB_API_KEY');
    process.exit(1);
  }
  
  const movieIds = process.argv.slice(2).map(id => parseInt(id)).filter(id => !isNaN(id));
  
  if (movieIds.length === 0) {
    console.error('❌ Użycie: node scripts/fetch-movie-by-id.js <movie_id> [movie_id2] ...');
    console.error('   Przykład: node scripts/fetch-movie-by-id.js 550 680');
    process.exit(1);
  }
  
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║      FilmMatch - Fetch Movie by ID                   ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  
  console.log(`\n📋 Do pobrania: ${movieIds.length} filmów`);
  
  const existingMovies = loadExistingMovies();
  const toFetch = movieIds.filter(id => !existingMovies.has(id));
  const alreadyHave = movieIds.filter(id => existingMovies.has(id));
  
  if (alreadyHave.length > 0) {
    console.log(`\n✓ Już masz (${alreadyHave.length}): ${alreadyHave.join(', ')}`);
  }
  
  if (toFetch.length === 0) {
    console.log('\n✅ Wszystkie filmy już są w bazie!');
    return;
  }
  
  console.log(`\n📥 Do pobrania (${toFetch.length}): ${toFetch.join(', ')}`);
  
  const fetchedMovies = [];
  for (const id of toFetch) {
    const movie = await fetchMovieById(id);
    if (movie) {
      fetchedMovies.push(movie);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (fetchedMovies.length > 0) {
    saveToBatch(fetchedMovies);
    generateConsolidatedFile();
    
    console.log('\n🎉 Gotowe!');
    console.log('▶️  Następny krok: npm run setup-db');
  } else {
    console.log('\n❌ Nie udało się pobrać żadnego filmu');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Błąd:', error);
    process.exit(1);
  });
}

module.exports = { fetchMovieById };
