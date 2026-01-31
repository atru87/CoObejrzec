/**
 * Skrypt do tworzenia i wypełniania bazy SQLite
 * 
 * Użycie:
 * npm install better-sqlite3
 * node scripts/setup-db.js
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function setupDatabase() {
  console.log('🗄️  Tworzę bazę danych SQLite...\n');

  const dataDir = path.join(__dirname, '..', 'data');
  const dbPath = path.join(dataDir, 'movies.db');
  const jsonPath = path.join(dataDir, 'movies-raw.json');

  // Usuń starą bazę jeśli istnieje
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️  Usunięto starą bazę');
  }

  // Wczytaj dane z JSON
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Nie znaleziono movies-raw.json');
    console.error('   Najpierw uruchom: node scripts/fetch-movies.js');
    process.exit(1);
  }

  const movies = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📚 Wczytano ${movies.length} filmów z JSON\n`);

  // Utwórz bazę
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL'); // Szybsze zapisy

  // Utwórz tabele
  db.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      title_pl TEXT,
      title_original TEXT,
      description TEXT,
      poster TEXT,
      backdrop TEXT,
      year INTEGER,
      rating REAL,
      vote_count INTEGER,
      popularity INTEGER,
      runtime INTEGER,
      is_polish INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movie_genres (
      movie_id INTEGER,
      genre_id INTEGER,
      FOREIGN KEY (movie_id) REFERENCES movies(id),
      FOREIGN KEY (genre_id) REFERENCES genres(id),
      PRIMARY KEY (movie_id, genre_id)
    );

    CREATE TABLE IF NOT EXISTS countries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT
    );

    CREATE TABLE IF NOT EXISTS movie_countries (
      movie_id INTEGER,
      country_id INTEGER,
      FOREIGN KEY (movie_id) REFERENCES movies(id),
      FOREIGN KEY (country_id) REFERENCES countries(id),
      PRIMARY KEY (movie_id, country_id)
    );

    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movie_keywords (
      movie_id INTEGER,
      keyword_id INTEGER,
      FOREIGN KEY (movie_id) REFERENCES movies(id),
      FOREIGN KEY (keyword_id) REFERENCES keywords(id),
      PRIMARY KEY (movie_id, keyword_id)
    );

    -- Indeksy dla szybkich zapytań
    CREATE INDEX idx_movies_year ON movies(year);
    CREATE INDEX idx_movies_rating ON movies(rating);
    CREATE INDEX idx_movies_popularity ON movies(popularity);
    CREATE INDEX idx_movies_polish ON movies(is_polish);
  `);

  console.log('✓ Utworzono tabele i indeksy\n');

  // Przygotuj statements
  const insertMovie = db.prepare(`
    INSERT INTO movies (id, title, title_pl, title_original, description, poster, 
                        backdrop, year, rating, vote_count, popularity, runtime, is_polish)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGenre = db.prepare(`
    INSERT OR IGNORE INTO genres (name) VALUES (?)
  `);

  const getGenreId = db.prepare(`
    SELECT id FROM genres WHERE name = ?
  `);

  const insertMovieGenre = db.prepare(`
    INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)
  `);

  const insertCountry = db.prepare(`
    INSERT OR IGNORE INTO countries (code) VALUES (?)
  `);

  const getCountryId = db.prepare(`
    SELECT id FROM countries WHERE code = ?
  `);

  const insertMovieCountry = db.prepare(`
    INSERT OR IGNORE INTO movie_countries (movie_id, country_id) VALUES (?, ?)
  `);

  const insertKeyword = db.prepare(`
    INSERT OR IGNORE INTO keywords (name) VALUES (?)
  `);

  const getKeywordId = db.prepare(`
    SELECT id FROM keywords WHERE name = ?
  `);

  const insertMovieKeyword = db.prepare(`
    INSERT OR IGNORE INTO movie_keywords (movie_id, keyword_id) VALUES (?, ?)
  `);

  // Importuj filmy (w transakcji dla szybkości)
  console.log('💾 Importuję filmy do bazy...');
  
  const insertAll = db.transaction((movies) => {
    let imported = 0;
    
    for (const movie of movies) {
      try {
        const isPolish = movie.countries?.includes('PL') ? 1 : 0;
        
        // Wstaw film
        insertMovie.run(
          movie.id,
          movie.title,
          movie.title_pl,
          movie.title_original,
          movie.description,
          movie.poster,
          movie.backdrop,
          movie.year,
          movie.rating,
          movie.vote_count,
          movie.popularity,
          movie.runtime,
          isPolish
        );

        // Wstaw gatunki
        if (movie.genres && movie.genres.length > 0) {
          for (const genre of movie.genres) {
            insertGenre.run(genre);
            const genreRow = getGenreId.get(genre);
            if (genreRow) {
              insertMovieGenre.run(movie.id, genreRow.id);
            }
          }
        }

        // Wstaw kraje
        if (movie.countries && movie.countries.length > 0) {
          for (const country of movie.countries) {
            insertCountry.run(country);
            const countryRow = getCountryId.get(country);
            if (countryRow) {
              insertMovieCountry.run(movie.id, countryRow.id);
            }
          }
        }

        // Wstaw keywords
        if (movie.keywords && movie.keywords.length > 0) {
          for (const keyword of movie.keywords) {
            insertKeyword.run(keyword);
            const keywordRow = getKeywordId.get(keyword);
            if (keywordRow) {
              insertMovieKeyword.run(movie.id, keywordRow.id);
            }
          }
        }

        imported++;
        if (imported % 500 === 0) {
          console.log(`   ✓ ${imported}/${movies.length}`);
        }
      } catch (error) {
        console.error(`   ⚠ Błąd przy imporcie filmu ${movie.id}:`, error.message);
      }
    }
    
    return imported;
  });

  const imported = insertAll(movies);
  console.log(`\n✅ Zaimportowano ${imported} filmów\n`);

  // Statystyki
  const stats = {
    totalMovies: db.prepare('SELECT COUNT(*) as count FROM movies').get().count,
    totalGenres: db.prepare('SELECT COUNT(*) as count FROM genres').get().count,
    avgRating: db.prepare('SELECT AVG(rating) as avg FROM movies').get().avg.toFixed(2),
    polishMovies: db.prepare('SELECT COUNT(*) as count FROM movies WHERE is_polish = 1').get().count,
    moviesByDecade: db.prepare(`
      SELECT (year / 10) * 10 as decade, COUNT(*) as count 
      FROM movies 
      WHERE year IS NOT NULL 
      GROUP BY decade 
      ORDER BY decade DESC 
      LIMIT 5
    `).all(),
    topGenres: db.prepare(`
      SELECT g.name, COUNT(*) as count
      FROM genres g
      JOIN movie_genres mg ON g.id = mg.genre_id
      GROUP BY g.id
      ORDER BY count DESC
      LIMIT 5
    `).all()
  };

  console.log('📊 Statystyki bazy:');
  console.log(`   Filmów: ${stats.totalMovies}`);
  console.log(`   Gatunków: ${stats.totalGenres}`);
  console.log(`   Średnia ocena: ${stats.avgRating}/10`);
  console.log(`   Filmów polskich: ${stats.polishMovies}`);
  console.log('\n   Top 5 dekad:');
  stats.moviesByDecade.forEach(d => {
    console.log(`      ${d.decade}s: ${d.count} filmów`);
  });
  console.log('\n   Top 5 gatunków:');
  stats.topGenres.forEach(g => {
    console.log(`      ${g.name}: ${g.count} filmów`);
  });

  db.close();
  
  console.log('\n✨ Baza gotowa do użycia!');
  console.log(`📂 Lokalizacja: ${dbPath}\n`);
}

// Uruchom
if (require.main === module) {
  try {
    setupDatabase();
  } catch (error) {
    console.error('💥 Krytyczny błąd:', error);
    process.exit(1);
  }
}

module.exports = { setupDatabase };
