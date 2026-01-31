# 🏗️ Architektura FilmMatch

## Przegląd Systemu

FilmMatch to full-stack aplikacja webowa zbudowana na Next.js 14 z wykorzystaniem App Router. System składa się z trzech głównych warstw:

### 1. Warstwa Prezentacji (Frontend)
- **Technologia**: React 18 + TypeScript + Tailwind CSS
- **State Management**: Zustand (localStorage persistence)
- **Animacje**: Framer Motion
- **Struktura**: Component-based architecture

### 2. Warstwa Logiki (Backend)
- **API**: Next.js API Routes (serverless)
- **Baza**: SQLite z better-sqlite3
- **Algorytm**: Custom recommendation engine

### 3. Warstwa Danych
- **Źródło**: TMDb API
- **Storage**: SQLite (relational)
- **Cache**: Brak (read-only queries są szybkie)

## Flow Aplikacji

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  Welcome Screen         │
│  - Start Quiz Button    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Quiz Component         │
│  - 7 Questions          │
│  - Progressive reveal   │
└──────────┬──────────────┘
           │ Submit
           ▼
┌─────────────────────────┐
│  POST /api/recommend    │
│  - QuizAnswers          │
│  - excludeIds           │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Recommendation Engine  │
│  1. Filter candidates   │
│  2. Score movies        │
│  3. Pick best match     │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  SQLite Query           │
│  - Join genres          │
│  - Join countries       │
│  - Filter & sort        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Movie Card Display     │
│  - Accept/Reject        │
│  - Add to watchlist     │
└──────────┬──────────────┘
           │
           ▼ (max 10x)
┌─────────────────────────┐
│  Session Complete       │
│  - Reset state          │
│  - Return to welcome    │
└─────────────────────────┘
```

## Algorytm Rekomendacji - Szczegóły Implementacji

### Etap 1: Budowa Kryteriów
```typescript
function buildCriteria(answers: QuizAnswers): SearchCriteria {
  const criteria: SearchCriteria = {
    excludeIds: rejectedMovies,
    limit: 200
  };
  
  // Twarde filtry (SQL WHERE)
  if (answers.genres.length > 0) {
    criteria.genres = answers.genres;
  }
  
  if (answers.era === 'old') {
    criteria.maxYear = 2000;
    criteria.minYear = 1950;
  }
  
  // ... więcej filtrów
  
  return criteria;
}
```

### Etap 2: Query SQL
```sql
SELECT DISTINCT m.*
FROM movies m
JOIN movie_genres mg ON m.id = mg.movie_id
JOIN genres g ON mg.genre_id = g.id
WHERE g.name IN ('Komedia', 'Dramat')
  AND m.year >= 2010
  AND m.is_polish = 0
  AND m.rating >= 6.5
  AND m.id NOT IN (1, 2, 3) -- excluded
ORDER BY m.rating DESC, m.popularity DESC
LIMIT 200
```

### Etap 3: Scoring
```typescript
function scoreMovie(movie: Movie, answers: QuizAnswers): number {
  let score = movie.rating; // Bazowy: 0-10
  
  // Gatunek matching
  const genreMatches = countMatches(movie.genres, answers.genres);
  score += genreMatches * 5;
  
  // Tempo
  if (matchesPace(movie, answers.pace)) {
    score += 3;
  }
  
  // Mood/klimat
  answers.mood.forEach(mood => {
    if (matchesMood(movie, mood)) {
      score += 4;
    }
  });
  
  // Bonusy
  if (movie.rating >= 8.0) score += 3;
  if (matchesPopularity(movie, answers.popularity)) score += 2;
  if (matchesRuntime(movie, answers.runtime)) score += 2;
  
  return score;
}
```

### Etap 4: Selekcja z Losowością
```typescript
const scored = candidates
  .map(movie => ({
    movie,
    score: scoreMovie(movie, answers)
  }))
  .sort((a, b) => b.score - a.score);

// Bierzemy top 10 i losujemy
const topMovies = scored.slice(0, 10);
const random = Math.floor(Math.random() * topMovies.length);
return topMovies[random];
```

## Optymalizacje

### Database Performance
1. **Indeksy**
   ```sql
   CREATE INDEX idx_movies_year ON movies(year);
   CREATE INDEX idx_movies_rating ON movies(rating);
   CREATE INDEX idx_movies_popularity ON movies(popularity);
   ```

2. **Query Strategy**
   - Fetch 200 candidates (zamiast wszystkich)
   - Single query z JOINs (nie N+1)
   - Read-only mode dla bezpieczeństwa

3. **WAL Mode**
   ```typescript
   db.pragma('journal_mode = WAL');
   // Write-Ahead Logging dla lepszej konkruencji
   ```

### Frontend Performance
1. **Code Splitting**
   - Next.js automatyczny dynamic import
   - Lazy load komponenty

2. **Animacje**
   - Framer Motion (GPU-accelerated)
   - `will-change` CSS hints

3. **State Management**
   - Zustand (lightweight)
   - localStorage persistence tylko dla watchlist

### API Performance
1. **Serverless Functions**
   - Cold start < 100ms
   - Warm response < 50ms

2. **No External Calls**
   - Wszystko lokalne (SQLite)
   - Brak rate limiting concerns

## Bezpieczeństwo

### SQL Injection Protection
```typescript
// ✅ DOBRE: Parametryzowane queries
db.prepare('SELECT * FROM movies WHERE id = ?').get(id);

// ❌ ZŁE: String concatenation
db.prepare(`SELECT * FROM movies WHERE id = ${id}`);
```

### XSS Protection
- React automatyczny escaping
- No `dangerouslySetInnerHTML`
- CSP headers w production

### CSRF Protection
- Next.js built-in protection
- Same-origin policy

## Skalowanie

### Obecne Limity
- **Baza**: 15,000 filmów (50MB)
- **Queries**: < 10ms response time
- **Concurrent Users**: 1000+ (serverless)

### Jak Skalować

#### Do 100,000 filmów
```typescript
// 1. Sharding po gatunkach
const db_comedy = new Database('comedy.db');
const db_drama = new Database('drama.db');

// 2. Index-only queries
CREATE INDEX covering_index ON movies(year, rating, popularity, id);

// 3. Materialized views dla popularnych query
```

#### Do 1M+ użytkowników/dzień
```typescript
// 1. Redis cache dla top recommendations
const cached = await redis.get(`rec:${hash(answers)}`);

// 2. CDN dla statycznych assets
// 3. PostgreSQL zamiast SQLite

// 4. Separate read replicas
```

#### Machine Learning Enhancement
```python
# Collaborative Filtering
from sklearn.neighbors import NearestNeighbors

# Train na user feedback
user_ratings = load_ratings()
model = NearestNeighbors(n_neighbors=10)
model.fit(user_ratings)

# Predict preferences
similar_users = model.kneighbors(current_user)
recommendations = aggregate_preferences(similar_users)
```

## Testing Strategy

### Unit Tests
```typescript
// recommendation-engine.test.ts
describe('getRecommendation', () => {
  it('should return comedy for comedy preference', () => {
    const answers = { genres: ['Komedia'], ... };
    const result = getRecommendation(answers);
    expect(result.movie.genres).toContain('Komedia');
  });
});
```

### Integration Tests
```typescript
// api.test.ts
describe('POST /api/recommend', () => {
  it('should return 200 with valid answers', async () => {
    const response = await fetch('/api/recommend', {
      method: 'POST',
      body: JSON.stringify({ answers: validAnswers })
    });
    expect(response.status).toBe(200);
  });
});
```

### E2E Tests (Playwright)
```typescript
test('complete quiz flow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Zacznij quiz');
  // ... complete quiz
  await expect(page.locator('.movie-card')).toBeVisible();
});
```

## Monitoring

### Metryki do Śledzenia
1. **Performance**
   - Query time (p50, p95, p99)
   - API response time
   - Frontend render time

2. **Business**
   - Quiz completion rate
   - Recommendation acceptance rate
   - Average session length

3. **Errors**
   - API error rate
   - Database errors
   - Frontend crashes

### Narzędzia
- **Vercel Analytics** - Basic metrics
- **Sentry** - Error tracking
- **Posthog** - Product analytics
- **Datadog** - Advanced monitoring

## Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: vercel/action@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

## Koszty Operacyjne

### Hosting (Vercel Pro)
- **$20/miesiąc** - Unlimited bandwidth
- **100GB bandwidth** w darmowym planie

### Baza Danych
- **$0** - SQLite lokalnie
- **$5/miesiąc** - Jeśli przeniesiesz na Turso

### API
- **$0** - Next.js serverless (w limitach)

### Total
- **Development**: $0/miesiąc
- **Production (small)**: $0-20/miesiąc
- **Production (scaled)**: $50-200/miesiąc

## Roadmap

### Phase 1 (MVP) ✅
- [x] Quiz system
- [x] Basic recommendation
- [x] SQLite database
- [x] Watch later list

### Phase 2 (Enhancement)
- [ ] User accounts
- [ ] Rating system
- [ ] Advanced filters
- [ ] Social sharing

### Phase 3 (Scale)
- [ ] ML recommendations
- [ ] Multiple languages
- [ ] Mobile app
- [ ] Where to watch integration
