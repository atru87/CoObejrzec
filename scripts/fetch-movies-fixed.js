/**
 * Skrypt do pobierania filmów z TMDB API (wersja z auto-save)
 * * NAPRAWIONE:
 * - Zapisuje postęp co 50 filmów (zamiast co 1000)
 * - Przy timeout/crash zapisuje WSZYSTKO co pobrano
 * - Lepsze recovery po restarcie
 * - FIX: Obsługa limitu 500 stron TMDB (zapobiega błędowi 400)
 * * Użycie:
 * node scripts/fetch-movies-fixed.js [ilość]
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const SAVE_INTERVAL = 50; // Zapisuj co 50 filmów (zamiast 1000)
const DATA_DIR = path.join(__dirname, '..', 'data');
const MOVIES_FILE = path.join(DATA_DIR, 'movies-raw.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'fetch-progress.json');

// Stan globalny - wszystkie pobrane filmy w tej sesji
let allMoviesMap = new Map();
let lastSaveCount = 0;

// Heartbeat
let lastHeartbeat = Date.now();
let heartbeatInterval = null;
let timeoutHandle = null;

function resetHeartbeat() {
  lastHeartbeat = Date.now();
  
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }
  
  // Timeout 30s - ZAPISZ i restart
  timeoutHandle = setTimeout(() => {
    console.error('\n⚠️  TIMEOUT: Brak aktywności przez 30s - ZAPISUJĘ WSZYSTKO!');
    saveAllMovies('TIMEOUT');
    console.log('🔄 EXIT - uruchom skrypt ponownie aby kontynuować\n');
    process.exit(1);
  }, 30000);
}

function startHeartbeat() {
  heartbeatInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - lastHeartbeat) / 1000);
    const total = allMoviesMap.size;
    console.log(`💓 Heartbeat: ${elapsed}s od ostatniego filmu, ${total} filmów w pamięci`);
  }, 30000);
}

function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (timeoutHandle) clearTimeout(timeoutHandle);
}

/**
 * KLUCZOWA FUNKCJA - Zapisuje WSZYSTKIE filmy do pliku
 */
function saveAllMovies(reason = 'REGULAR') {
  const movies = Array.from(allMoviesMap.values());
  
  if (movies.length === 0) {
    console.log(`⚠️  [${reason}] Brak filmów do zapisania`);
    return 0;
  }
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // Zapisz główny plik
  fs.writeFileSync(MOVIES_FILE, JSON.stringify(movies, null, 2));
  
  // Zapisz progress
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    totalMovies: movies.length,
    lastSave: new Date().toISOString(),
    reason: reason
  }, null, 2));
  
  const newSaved = movies.length - lastSaveCount;
  console.log(`\n💾 [${reason}] Zapisano ${movies.length} filmów (+${newSaved} nowych) do movies-raw.json\n`);
  lastSaveCount = movies.length;
  
  return movies.length;
}

/**
 * Wczytuje istniejące filmy z pliku
 */
function loadExistingMovies() {
  if (!fs.existsSync(MOVIES_FILE)) {
    console.log('📂 Brak istniejącego pliku movies-raw.json - zaczynam od zera\n');
    return new Map();
  }
  
  try {
    const movies = JSON.parse(fs.readFileSync(MOVIES_FILE, 'utf-8'));
    const moviesMap = new Map();
    
    movies.forEach(movie => {
      moviesMap.set(movie.id, movie);
    });
    
    console.log(`📂 Wczytano ${moviesMap.size} istniejących filmów z movies-raw.json\n`);
    return moviesMap;
  } catch (error) {
    console.error('⚠️  Błąd wczytywania movies-raw.json:', error.message);
    return new Map();
  }
}

// Globalny error handler - ZAPISZ PRZED CRASHEM
process.on('uncaughtException', (error) => {
  console.error('\n💥 UNCAUGHT EXCEPTION:', error.message);
  saveAllMovies('CRASH');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n💥 UNHANDLED REJECTION:', reason);
  saveAllMovies('CRASH');
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  Ctrl+C - zapisuję przed wyjściem...');
  saveAllMovies('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM - zapisuję przed wyjściem...');
  saveAllMovies('SIGTERM');
  process.exit(0);
});

// Test API
async function testAPI() {
  console.log('🔍 Testuję połączenie z TMDb API...\n');
  
  try {
    const testUrl = `${BASE_URL}/movie/550?api_key=${API_KEY}`;
    const response = await fetch(testUrl);
    
    if (response.status === 401) {
      console.error('❌ Błąd 401: Nieprawidłowy API key!');
      return false;
    }
    
    if (response.status === 429) {
      console.error('❌ Błąd 429: Rate limit! Poczekaj 10-60 minut.');
      return false;
    }
    
    if (!response.ok) {
      console.error(`❌ Błąd ${response.status}: ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ API działa! Test: "${data.title}" (${data.release_date?.substring(0, 4)})\n`);
    return true;
    
  } catch (error) {
    console.error('❌ Błąd połączenia:', error.message);
    return false;
  }
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout na request
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 30;
        console.log(`⚠️  Rate limit! Czekam ${retryAfter}s...`);
        
        // ZAPISZ przed czekaniem
        if (allMoviesMap.size > lastSaveCount) {
          saveAllMovies('RATE_LIMIT');
        }
        
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`   ⚠️  Request timeout, retry ${i + 1}/${retries}`);
      } else if (i === retries - 1) {
        throw error;
      } else {
        console.log(`   ⚠️  Retry ${i + 1}/${retries}: ${error.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

async function getMovieDetails(movieId) {
  const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=pl-PL&append_to_response=credits,keywords`;
  return await fetchWithRetry(url);
}

async function fetchMovies(targetCount = 15000) {
  if (!API_KEY) {
    console.error('❌ Brak TMDB_API_KEY!');
    console.error('   Windows: set TMDB_API_KEY=twoj_klucz');
    console.error('   Linux/Mac: export TMDB_API_KEY=twoj_klucz\n');
    process.exit(1);
  }

  const apiWorks = await testAPI();
  if (!apiWorks) {
    process.exit(1);
  }

  console.log('🎬 Rozpoczynam pobieranie filmów z TMDB...');
  console.log(`📊 Cel: ${targetCount} filmów`);
  console.log(`💾 Auto-save co ${SAVE_INTERVAL} filmów\n`);

  // Wczytaj istniejące
  allMoviesMap = loadExistingMovies();
  lastSaveCount = allMoviesMap.size;
  
  if (allMoviesMap.size >= targetCount) {
    console.log(`✅ Masz już ${allMoviesMap.size} filmów (cel: ${targetCount})`);
    console.log('ℹ️  Zwiększ targetCount jeśli chcesz więcej.\n');
    return Array.from(allMoviesMap.values());
  }
  
  const remaining = targetCount - allMoviesMap.size;
  console.log(`📥 Do pobrania: ${remaining} filmów\n`);
  
  // Start heartbeat
  startHeartbeat();
  resetHeartbeat();
  
  const endpoints = ['popular', 'top_rated', 'now_playing', 'upcoming'];
  let currentEndpoint = 0;
  let page = 1;
  let consecutiveErrors = 0;
  let newMoviesCount = 0;
  let skippedDuplicates = 0;
  let skippedNoData = 0;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  while (allMoviesMap.size < targetCount && consecutiveErrors < 5) {
    const endpoint = endpoints[currentEndpoint % endpoints.length];
    
    // NAPRAWA BŁĘDU 400: TMDB nie pozwala na page > 500
    if (page > 500) {
      console.log(`\n🔄 Osiągnięto limit 500 stron dla ${endpoint}. Zmieniam endpoint...`);
      currentEndpoint++;
      page = 1;
      if (currentEndpoint >= endpoints.length) {
        console.log('⚠️  Wykorzystano wszystkie dostępne endpointy. Kończę pobieranie.');
        break;
      }
      continue;
    }

    try {
      const url = `${BASE_URL}/movie/${endpoint}?api_key=${API_KEY}&language=pl-PL&page=${page}`;
      const data = await fetchWithRetry(url);
      
      if (!data.results || data.results.length === 0) {
        console.log(`⚠️  Brak wyników dla ${endpoint} strona ${page}, zmieniam endpoint`);
        currentEndpoint++;
        page = 1;
        continue;
      }
      
      for (const movie of data.results) {
        // Sprawdź duplikat
        if (allMoviesMap.has(movie.id)) {
          skippedDuplicates++;
          continue;
        }
        
        // Sprawdź wymagane dane
        if (!movie.overview || !movie.poster_path) {
          skippedNoData++;
          continue;
        }
        
        try {
          // Pobierz szczegóły
          const details = await getMovieDetails(movie.id);
          
          const processedMovie = {
            id: movie.id,
            title: movie.title,
            title_pl: details.title || movie.title,
            title_original: details.original_title,
            description: details.overview || movie.overview,
            poster: `${IMAGE_BASE}${movie.poster_path}`,
            backdrop: movie.backdrop_path ? `${IMAGE_BASE}${movie.backdrop_path}` : null,
            genres: details.genres?.map(g => g.name) || [],
            genre_ids: movie.genre_ids || [],
            year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
            rating: Math.round(movie.vote_average * 10) / 10,
            vote_count: movie.vote_count,
            popularity: Math.round(movie.popularity),
            countries: details.production_countries?.map(c => c.iso_3166_1) || [],
            runtime: details.runtime,
            keywords: details.keywords?.keywords?.slice(0, 10).map(k => k.name) || []
          };

          // DODAJ DO MAPY
          allMoviesMap.set(movie.id, processedMovie);
          newMoviesCount++;
          
          // Reset heartbeat
          resetHeartbeat();
          
          // Log
          const total = allMoviesMap.size;
          const percent = ((total / targetCount) * 100).toFixed(1);
          console.log(`✓ ${total}/${targetCount} [${endpoint} p.${page}]: "${processedMovie.title_pl}" (${processedMovie.year})`);
          
          // AUTO-SAVE co SAVE_INTERVAL filmów
          if (newMoviesCount % SAVE_INTERVAL === 0) {
            saveAllMovies('AUTO');
          }
          
          // Rate limiting - 400ms (zgodnie z zaleceniami TMDB dla stabilności)
          await new Promise(resolve => setTimeout(resolve, 400));
          
        } catch (detailError) {
          console.log(`   ⚠️  Błąd szczegółów filmu ${movie.id}: ${detailError.message}`);
        }
        
        // Sprawdź cel
        if (allMoviesMap.size >= targetCount) break;
      }
      
      page++;
      consecutiveErrors = 0;
      
    } catch (error) {
      console.error(`\n❌ Błąd na stronie ${page} (${endpoint}):`, error.message);
      consecutiveErrors++;
      
      // ZAPISZ przy błędach
      if (allMoviesMap.size > lastSaveCount) {
        saveAllMovies('ERROR');
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // KOŃCOWY ZAPIS
  stopHeartbeat();
  saveAllMovies('COMPLETE');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`✅ Pobrano ${newMoviesCount} NOWYCH filmów`);
  console.log(`📊 Łącznie w bazie: ${allMoviesMap.size} filmów`);
  console.log(`⏭️  Pominięto duplikatów: ${skippedDuplicates}`);
  console.log(`⏭️  Pominięto bez danych: ${skippedNoData}\n`);
  
  const allMovies = Array.from(allMoviesMap.values());
  
  if (allMovies.length > 0) {
    const stats = {
      total: allMovies.length,
      avgRating: (allMovies.reduce((sum, m) => sum + m.rating, 0) / allMovies.length).toFixed(2),
      withPolish: allMovies.filter(m => m.countries?.includes('PL')).length
    };
    
    console.log('📈 Statystyki:');
    console.log(`   Łącznie filmów: ${stats.total}`);
    console.log(`   Średnia ocena: ${stats.avgRating}/10`);
    console.log(`   Filmy polskie: ${stats.withPolish}\n`);
  }
  
  return allMovies;
}

// URUCHOM
if (require.main === module) {
  const targetCount = parseInt(process.argv[2]) || 15000;
  
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║      FilmMatch - TMDb Fetcher v3.2 (Full Fix)         ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  fetchMovies(targetCount)
    .then(() => {
      console.log('🎉 GOTOWE!');
      console.log(`📄 Plik: data/movies-raw.json`);
      console.log('\n▶️  Następny krok: npm run setup-db\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Krytyczny błąd:', error);
      saveAllMovies('FATAL');
      process.exit(1);
    });
}

module.exports = { fetchMovies, loadExistingMovies, saveAllMovies };