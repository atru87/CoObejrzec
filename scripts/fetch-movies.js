/**
 * Skrypt do pobierania filmów z TMDB API (wersja przyrostowa + improved logging)
 * 
 * Użycie:
 * node scripts/fetch-movies.js [ilość]
 * 
 * Przykłady:
 * node scripts/fetch-movies.js 1000   # Pobierz 1000 filmów
 * node scripts/fetch-movies.js 50000  # Pobierz 50000 filmów
 * node scripts/fetch-movies.js        # Pobierz 15000 (domyślnie)
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const BATCH_SIZE = 1000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const BATCHES_DIR = path.join(DATA_DIR, 'batches');

// Heartbeat - restart po 30s bez aktywności
let lastHeartbeat = Date.now();
let lastActivityTimeout = null;

function resetHeartbeat() {
  lastHeartbeat = Date.now();
  
  if (lastActivityTimeout) {
    clearTimeout(lastActivityTimeout);
  }
  
  // Timeout 30s
  lastActivityTimeout = setTimeout(() => {
    console.error('\n⚠️  TIMEOUT: Brak aktywności przez 30s - zapisuję i restartuję!');
    
    // Save progress - zbierz WSZYSTKIE filmy z bazy
    const DATA_DIR = path.join(__dirname, '..', 'data');
    const BATCHES_DIR = path.join(DATA_DIR, 'batches');
    
    try {
      const { generateConsolidatedFile } = require('./fetch-movies.js');
      generateConsolidatedFile();
    } catch (e) {
      console.log('⚠️  Nie udało się wygenerować consolidated file');
    }
    
    console.log('🔄 EXIT - persistent wrapper zrestartuje za 5s\n');
    process.exit(1);
  }, 30000);
}

setInterval(() => {
  const now = Date.now();
  const elapsed = Math.floor((now - lastHeartbeat) / 1000);
  console.log(`💓 Heartbeat: Żyję, minęło ${elapsed}s od ostatniego filmu`);
  
  if (elapsed >= 30) {
    console.error('⚠️  30s bez aktywności - wymuszam restart');
    process.exit(1);
  }
}, 30000);

// Globalny error handler
process.on('uncaughtException', (error) => {
  console.error('\n💥 UNCAUGHT EXCEPTION:', error);
  const errorLog = `\n[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${error.stack}\n`;
  fs.appendFileSync(path.join(DATA_DIR, 'fetch-errors.log'), errorLog);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 UNHANDLED REJECTION:', reason);
  const errorLog = `\n[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason}\n`;
  fs.appendFileSync(path.join(DATA_DIR, 'fetch-errors.log'), errorLog);
  process.exit(1);
});

// Test API przed rozpoczęciem
async function testAPI() {
  console.log('🔍 Testuję połączenie z TMDb API...\n');
  
  try {
    const testUrl = `${BASE_URL}/movie/550?api_key=${API_KEY}`;
    const response = await fetch(testUrl);
    
    if (response.status === 401) {
      console.error('❌ Błąd 401: Nieprawidłowy API key!');
      console.error('   Sprawdź czy TMDB_API_KEY jest poprawny.\n');
      return false;
    }
    
    if (response.status === 429) {
      console.error('❌ Błąd 429: Rate limit exceeded!');
      console.error('   TMDb zbanował Twoje IP. Poczekaj 10-60 minut.\n');
      return false;
    }
    
    if (!response.ok) {
      console.error(`❌ Błąd ${response.status}: ${response.statusText}\n`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ API działa! Test movie: "${data.title}" (${data.release_date?.substring(0, 4)})\n`);
    return true;
    
  } catch (error) {
    console.error('❌ Błąd połączenia:', error.message);
    console.error('   Sprawdź połączenie internetowe.\n');
    return false;
  }
}

/**
 * Wczytuje wszystkie istniejące filmy z batch'y
 */
function loadExistingMovies() {
  const existingMovies = new Map();
  
  if (!fs.existsSync(BATCHES_DIR)) {
    console.log('📂 Brak istniejących batch\'y - zaczynam od zera\n');
    return existingMovies;
  }
  
  const batchFiles = fs.readdirSync(BATCHES_DIR)
    .filter(f => f.startsWith('movies_') && f.endsWith('.json'))
    .sort();
  
  if (batchFiles.length === 0) {
    console.log('📂 Brak istniejących batch\'y - zaczynam od zera\n');
    return existingMovies;
  }
  
  console.log(`📂 Wczytuję istniejące batch'e...\n`);
  
  for (const batchFile of batchFiles) {
    const batchPath = path.join(BATCHES_DIR, batchFile);
    const movies = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
    
    movies.forEach(movie => {
      existingMovies.set(movie.id, movie);
    });
    
    console.log(`   ✓ ${batchFile}: ${movies.length} filmów`);
  }
  
  console.log(`\n📊 Łącznie wczytano: ${existingMovies.size} unikalnych filmów\n`);
  return existingMovies;
}

/**
 * Zapisuje batch filmów do pliku (DOPISUJE do istniejącego)
 */
function saveBatch(movies, batchNumber) {
  if (!fs.existsSync(BATCHES_DIR)) {
    fs.mkdirSync(BATCHES_DIR, { recursive: true });
  }
  
  const start = (batchNumber - 1) * BATCH_SIZE + 1;
  const end = batchNumber * BATCH_SIZE;
  const filename = `movies_${String(start).padStart(6, '0')}-${String(end).padStart(6, '0')}.json`;
  const filepath = path.join(BATCHES_DIR, filename);
  
  // WCZYTAJ istniejący plik jeśli istnieje
  let existingMovies = [];
  if (fs.existsSync(filepath)) {
    existingMovies = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  }
  
  // POŁĄCZ ze starymi (unikaj duplikatów po ID)
  const existingIds = new Set(existingMovies.map(m => m.id));
  const newMovies = movies.filter(m => !existingIds.has(m.id));
  const allMovies = [...existingMovies, ...newMovies];
  
  fs.writeFileSync(filepath, JSON.stringify(allMovies, null, 2));
  console.log(`\n💾 Zapisano batch: ${filename} (${existingMovies.length} starych + ${newMovies.length} nowych = ${allMovies.length} razem)\n`);
  
  return filepath;
}

/**
 * Generuje consolidated file ze wszystkich batch'y
 */
function generateConsolidatedFile() {
  console.log('\n📦 Generuję skonsolidowany plik movies-raw.json...');
  
  const existingMovies = loadExistingMovies();
  const allMovies = Array.from(existingMovies.values());
  
  const outputPath = path.join(DATA_DIR, 'movies-raw.json');
  fs.writeFileSync(outputPath, JSON.stringify(allMovies, null, 2));
  
  console.log(`✅ Zapisano ${allMovies.length} filmów do movies-raw.json\n`);
  return allMovies;
}

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
      console.log(`   ⚠️  Retry ${i + 1}/${retries} (${delay}ms)`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function getMovieDetails(movieId) {
  const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=pl-PL&append_to_response=credits,keywords`;
  
  // Timeout wrapper
  const fetchWithTimeout = (url, timeout = 10000) => {
    return Promise.race([
      fetchWithRetry(url),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout - request trwał >10s')), timeout)
      )
    ]);
  };
  
  for (let i = 0; i < 5; i++) {
    try {
      return await fetchWithTimeout(url);
    } catch (error) {
      if (i === 4) throw error;
      const delay = 2000 * (i + 1);
      console.log(`   ⚠️  Retry szczegółów filmu ${movieId} (próba ${i + 1}/5, czekam ${delay}ms) - ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function fetchMovies(targetCount = 15000) {
  if (!API_KEY) {
    console.error('❌ Brak TMDB_API_KEY. Ustaw zmienną środowiskową.');
    console.error('   Windows: set TMDB_API_KEY=twoj_klucz');
    console.error('   Linux/Mac: export TMDB_API_KEY=twoj_klucz\n');
    process.exit(1);
  }

  // TEST API
  const apiWorks = await testAPI();
  if (!apiWorks) {
    process.exit(1);
  }

  console.log('🎬 Rozpoczynam pobieranie filmów z TMDB...');
  console.log(`📊 Cel: ${targetCount} filmów\n`);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const existingMovies = loadExistingMovies();
  const alreadyHave = existingMovies.size;
  
  if (alreadyHave >= targetCount) {
    console.log(`✅ Masz już ${alreadyHave} filmów (cel: ${targetCount})`);
    console.log('ℹ️  Nic nowego do pobrania. Zwiększ targetCount jeśli chcesz więcej.\n');
    generateConsolidatedFile();
    return Array.from(existingMovies.values());
  }
  
  console.log(`📥 Trzeba pobrać jeszcze: ${targetCount - alreadyHave} filmów\n`);
  
  const movies = [];
  const movieIds = new Set(existingMovies.keys());
  
  const endpoints = ['popular', 'top_rated', 'now_playing'];
  let currentEndpoint = 0;
  let page = 1;
  let consecutiveErrors = 0;
  let currentBatch = [];
  let batchNumber = Math.floor(alreadyHave / BATCH_SIZE) + 1;
  let skippedDuplicates = 0;

  // Force save handler
  const forceSave = () => {
    console.log('\n💾 FORCE SAVE - zapisuję aktualny batch...');
    if (currentBatch.length > 0) {
      saveBatch(currentBatch, batchNumber);
      console.log(`✅ Zapisano ${currentBatch.length} filmów przed wyjściem`);
    }
    generateConsolidatedFile();
    process.exit(1);
  };
  
  process.on('forceExit', forceSave);
  process.on('SIGINT', forceSave); // Ctrl+C
  process.on('SIGTERM', forceSave);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  while (movies.length + alreadyHave < targetCount && consecutiveErrors < 5) {
    try {
      const endpoint = endpoints[currentEndpoint % endpoints.length];
      const url = `${BASE_URL}/movie/${endpoint}?api_key=${API_KEY}&language=pl-PL&page=${page}`;
      
      const data = await fetchWithRetry(url);
      
      for (const movie of data.results) {
        if (movieIds.has(movie.id)) {
          skippedDuplicates++;
          continue;
        }
        
        if (!movie.overview || !movie.poster_path) continue;
        
        movieIds.add(movie.id);
        
        try {
          const totalNow = movies.length + alreadyHave + 1;
          const progressPercent = ((totalNow / targetCount) * 100).toFixed(1);
          
          let details;
          try {
            details = await getMovieDetails(movie.id);
          } catch (detailError) {
            // Loguj błąd do pliku
            const errorLog = `[${new Date().toISOString()}] Film ID: ${movie.id}, Title: "${movie.title}", Error: ${detailError.message}\n`;
            fs.appendFileSync(path.join(DATA_DIR, 'fetch-errors.log'), errorLog);
            continue;
          }
          
          const processedMovie = {
            id: movie.id,
            title: movie.title,
            title_pl: details.title || movie.title,
            title_original: details.original_title,
            description: details.overview || movie.overview,
            poster: movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : null,
            backdrop: movie.backdrop_path ? `${IMAGE_BASE}${movie.backdrop_path}` : null,
            genres: details.genres.map(g => g.name),
            genre_ids: movie.genre_ids || [],
            year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
            rating: Math.round(movie.vote_average * 10) / 10,
            vote_count: movie.vote_count,
            popularity: Math.round(movie.popularity),
            countries: details.production_countries?.map(c => c.iso_3166_1) || [],
            runtime: details.runtime,
            keywords: details.keywords?.keywords?.slice(0, 10).map(k => k.name) || []
          };

          movies.push(processedMovie);
          currentBatch.push(processedMovie);
          
          // Reset heartbeat i timeout
          resetHeartbeat();
          
          // Wypisuj każdy film
          console.log(`✓ Film ${totalNow}/${targetCount} (${progressPercent}%): "${processedMovie.title_pl}" (${processedMovie.year}) - ${processedMovie.rating}/10`);
          
          // Zapisuj progress co 1% do pliku
          const prevPercent = (((totalNow - 1) / targetCount) * 100).toFixed(1);
          const shouldSave = Math.floor(progressPercent) !== Math.floor(prevPercent);
          
          if (shouldSave || totalNow === 1 || totalNow === targetCount) {
            const progressFile = path.join(DATA_DIR, 'fetch-progress.json');
            fs.writeFileSync(progressFile, JSON.stringify({
              totalFetched: movies.length,
              totalWithExisting: totalNow,
              targetCount: targetCount,
              timestamp: new Date().toISOString()
            }, null, 2));
          }
          
          // Zapisz batch co BATCH_SIZE filmów
          if (currentBatch.length >= BATCH_SIZE) {
            saveBatch(currentBatch, batchNumber);
            currentBatch = [];
            batchNumber++;
          }
          
          // Rate limiting - bezpieczne 500ms (wolniej ale stabilniej)
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (detailError) {
          process.stdout.write('\r' + ' '.repeat(120) + '\r');
          console.log(`⚠️  Nie można pobrać szczegółów dla filmu ${movie.id}: ${detailError.message}`);
        }
        
        if (movies.length + alreadyHave >= targetCount) break;
      }
      
      page++;
      consecutiveErrors = 0;
      
      if (page % 10 === 0) {
        currentEndpoint++;
        page = 1;
      }
      
    } catch (error) {
      console.error(`\n❌ Błąd na stronie ${page}:`, error.message);
      consecutiveErrors++;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Zapisz ostatni niekompletny batch
  if (currentBatch.length > 0) {
    saveBatch(currentBatch, batchNumber);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`✅ Pobrano ${movies.length} NOWYCH filmów`);
  console.log(`📊 Łącznie w bazie: ${movies.length + alreadyHave} filmów`);
  console.log(`⏭️  Pominięto duplikatów: ${skippedDuplicates}\n`);
  
  const allMovies = generateConsolidatedFile();
  
  const stats = {
    total: allMovies.length,
    newlyAdded: movies.length,
    avgRating: (allMovies.reduce((sum, m) => sum + m.rating, 0) / allMovies.length).toFixed(2),
    withPolish: allMovies.filter(m => m.countries.includes('PL')).length
  };
  
  console.log('📈 Statystyki końcowe:');
  console.log(`   Łącznie filmów: ${stats.total}`);
  console.log(`   Nowo dodanych: ${stats.newlyAdded}`);
  console.log(`   Średnia ocena: ${stats.avgRating}/10`);
  console.log(`   Filmy polskie: ${stats.withPolish}\n`);
  
  return allMovies;
}

// Uruchom
if (require.main === module) {
  const targetCount = parseInt(process.argv[2]) || 15000;
  
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║        FilmMatch - TMDb Movie Fetcher v2.0            ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  fetchMovies(targetCount)
    .then((movies) => {
      console.log('🎉 GOTOWE!');
      console.log(`📂 Pliki batch: data/batches/movies_*.json`);
      console.log(`📄 Skonsolidowany: data/movies-raw.json`);
      console.log('\n▶️  Następny krok: npm run setup-db\n');
    })
    .catch(error => {
      console.error('\n💥 Krytyczny błąd:', error);
      process.exit(1);
    });
}

module.exports = { fetchMovies, loadExistingMovies, generateConsolidatedFile };
