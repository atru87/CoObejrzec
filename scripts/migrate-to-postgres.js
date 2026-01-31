const Database = require('better-sqlite3');
const { sql } = require('@vercel/postgres');
const path = require('path');

async function migrate() {
  console.log('🚀 Rozpoczynam migrację SQLite → Vercel Postgres...\n');

  // Otwórz SQLite
  const dbPath = path.join(__dirname, '..', 'data', 'movies.db');
  const sqlite = new Database(dbPath, { readonly: true });

  try {
    // 1. Utwórz tabele
    console.log('📋 Tworzę tabele...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        title_pl TEXT,
        title_original TEXT,
        description TEXT,
        poster TEXT,
        backdrop TEXT,
        year INTEGER,
        rating DECIMAL(3,1),
        vote_count INTEGER,
        popularity DECIMAL(10,3),
        runtime INTEGER,
        is_polish BOOLEAN DEFAULT FALSE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS genres (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS countries (
        id INTEGER PRIMARY KEY,
        code TEXT UNIQUE NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS movie_genres (
        movie_id INTEGER,
        genre_id INTEGER,
        PRIMARY KEY (movie_id, genre_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS movie_countries (
        movie_id INTEGER,
        country_id INTEGER,
        PRIMARY KEY (movie_id, country_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        page TEXT NOT NULL,
        ip TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        UNIQUE(page, ip)
      )
    `;

    console.log('✅ Tabele utworzone\n');

    // 2. Migruj gatunki
    console.log('🎭 Migruję gatunki...');
    const genres = sqlite.prepare('SELECT * FROM genres').all();
    for (const genre of genres) {
      await sql`
        INSERT INTO genres (id, name)
        VALUES (${genre.id}, ${genre.name})
        ON CONFLICT (name) DO NOTHING
      `;
    }
    console.log(`✅ Zmigrowano ${genres.length} gatunków\n`);

    // 3. Migruj kraje
    console.log('🌍 Migruję kraje...');
    const countries = sqlite.prepare('SELECT * FROM countries').all();
    for (const country of countries) {
      await sql`
        INSERT INTO countries (id, code)
        VALUES (${country.id}, ${country.code})
        ON CONFLICT (code) DO NOTHING
      `;
    }
    console.log(`✅ Zmigrowano ${countries.length} krajów\n`);

    // 4. Migruj filmy (w batchach po 100)
    console.log('🎬 Migruję filmy...');
    const totalMovies = sqlite.prepare('SELECT COUNT(*) as count FROM movies').get().count;
    const batchSize = 100;
    let migrated = 0;

    for (let offset = 0; offset < totalMovies; offset += batchSize) {
      const movies = sqlite.prepare(`
        SELECT * FROM movies LIMIT ${batchSize} OFFSET ${offset}
      `).all();

      for (const movie of movies) {
        await sql`
          INSERT INTO movies (
            id, title, title_pl, title_original, description,
            poster, backdrop, year, rating, vote_count,
            popularity, runtime, is_polish
          )
          VALUES (
            ${movie.id}, ${movie.title}, ${movie.title_pl}, 
            ${movie.title_original}, ${movie.description},
            ${movie.poster}, ${movie.backdrop}, ${movie.year},
            ${movie.rating}, ${movie.vote_count}, ${movie.popularity},
            ${movie.runtime}, ${movie.is_polish === 1}
          )
          ON CONFLICT (id) DO NOTHING
        `;

        migrated++;
        if (migrated % 100 === 0) {
          console.log(`   📊 ${migrated}/${totalMovies} filmów...`);
        }
      }
    }
    console.log(`✅ Zmigrowano ${migrated} filmów\n`);

    // 5. Migruj powiązania film-gatunek
    console.log('🔗 Migruję powiązania film-gatunek...');
    const movieGenres = sqlite.prepare('SELECT * FROM movie_genres').all();
    for (const mg of movieGenres) {
      await sql`
        INSERT INTO movie_genres (movie_id, genre_id)
        VALUES (${mg.movie_id}, ${mg.genre_id})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log(`✅ Zmigrowano ${movieGenres.length} powiązań\n`);

    // 6. Migruj powiązania film-kraj
    console.log('🔗 Migruję powiązania film-kraj...');
    const movieCountries = sqlite.prepare('SELECT * FROM movie_countries').all();
    for (const mc of movieCountries) {
      await sql`
        INSERT INTO movie_countries (movie_id, country_id)
        VALUES (${mc.movie_id}, ${mc.country_id})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log(`✅ Zmigrowano ${movieCountries.length} powiązań\n`);

    // 7. Utwórz indeksy dla wydajności
    console.log('⚡ Tworzę indeksy...');
    await sql`CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_movies_popularity ON movies(popularity DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_movie_genres_movie ON movie_genres(movie_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_movie_countries_movie ON movie_countries(movie_id)`;
    console.log('✅ Indeksy utworzone\n');

    console.log('🎉 Migracja zakończona sukcesem!');
    console.log(`📊 Statystyki:`);
    console.log(`   - Filmy: ${migrated}`);
    console.log(`   - Gatunki: ${genres.length}`);
    console.log(`   - Kraje: ${countries.length}`);
    console.log(`   - Powiązania: ${movieGenres.length + movieCountries.length}`);

  } catch (error) {
    console.error('❌ Błąd migracji:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

migrate();
