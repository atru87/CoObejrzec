# 🎬 FilmMatch - Inteligentny System Rekomendacji Filmów

Nowoczesna aplikacja webowa do rekomendowania filmów na podstawie preferencji użytkownika. Zbudowana w Next.js 14 z TypeScript, Tailwind CSS i SQLite.

## ✨ Funkcjonalności

### Główne
- **Spersonalizowany quiz** - 7 pytań o preferencje filmowe
- **Inteligentny algorytm rekomendacji** - scoring na podstawie odpowiedzi
- **Baza 15,000+ filmów** - dane z TMDb API
- **Lista "do obejrzenia"** - persystencja w localStorage
- **Tryb losowy** - "coś totalnie innego"
- **Limit 10 rekomendacji** - zapobiega niekończącym się sesjom

### UX/Design
- Nowoczesny, minimalistyczny design (2026-level)
- Płynne animacje (Framer Motion)
- W pełni responsywny (mobile-first)
- Accessibility-friendly
- Szybkie ładowanie

## 🚀 Szybki Start

### Wymagania
- Node.js 18+ 
- npm lub yarn

### Instalacja

```bash
# 1. Sklonuj repozytorium
git clone <repo-url>
cd film-match

# 2. Zainstaluj zależności
npm install

# 3. Pobierz bazę filmów
# Najpierw uzyskaj darmowy API key z https://www.themoviedb.org/settings/api
export TMDB_API_KEY=twoj_klucz_api

# Pobierz filmy (zajmie ~10-15 minut dla 15k filmów)
npm run fetch-movies

# 4. Zainicjalizuj bazę SQLite
npm run setup-db

# 5. Uruchom development server
npm run dev
```

Aplikacja będzie dostępna na `http://localhost:3000`

## 📁 Struktura Projektu

```
film-match/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Główna strona
│   │   ├── layout.tsx         # Layout aplikacji
│   │   ├── globals.css        # Globalne style
│   │   └── api/               # API Routes
│   │       ├── movies/        # Endpoint do filmów
│   │       └── recommend/     # Endpoint rekomendacji
│   ├── components/            # Komponenty React
│   │   ├── Quiz/             # Komponenty quizu
│   │   ├── MovieCard/        # Karta filmu
│   │   └── WatchLater/       # Lista do obejrzenia
│   ├── lib/                  # Logika biznesowa
│   │   ├── db.ts            # Moduł bazy danych
│   │   ├── recommendation-engine.ts  # Algorytm rekomendacji
│   │   └── types.ts         # Typy TypeScript
│   └── store/               # State management (Zustand)
├── scripts/                 # Skrypty pomocnicze
│   ├── fetch-movies.js     # Pobieranie z TMDb
│   └── setup-db.js         # Inicjalizacja SQLite
├── data/                   # Dane (gitignored)
│   ├── movies-raw.json    # Raw data z API
│   └── movies.db          # Baza SQLite
└── public/                # Zasoby statyczne
```

## 🎯 Jak Działa Algorytm Rekomendacji

### Faza 1: Filtrowanie (Hard Criteria)
```typescript
// Zawężamy bazę do filmów spełniających kryteria:
- Gatunek (jeśli wybrano konkretne)
- Era (stare/nowe)
- Pochodzenie (polskie/zagraniczne)
- Długość filmu
- Popularność (blockbuster vs niszowe)
```

### Faza 2: Scoring (Soft Matching)
```typescript
// Każdy film dostaje punkty za:
- Bazową ocenę IMDb (0-10 pkt)
- Dopasowanie gatunku (5 pkt/gatunek)
- Tempo (3 pkt)
- Mood/klimat (4 pkt/mood)
- Popularność (2 pkt)
- Wysoką ocenę >8.0 (3 pkt)
- Odpowiednią długość (2 pkt)
```

### Faza 3: Wybór
```typescript
// Z top 10 filmów losujemy jeden
// Dzięki temu każda sesja jest unikalna
```

## 🗄️ Baza Danych

### Schema SQLite

```sql
-- Główna tabela filmów
movies (
  id, title, title_pl, title_original,
  description, poster, backdrop,
  year, rating, vote_count, popularity,
  runtime, is_polish
)

-- Gatunki (many-to-many)
genres -> movie_genres <- movies

-- Kraje produkcji (many-to-many)
countries -> movie_countries <- movies

-- Keywords dla mood matching (many-to-many)
keywords -> movie_keywords <- movies
```

### Indeksy dla wydajności
- `idx_movies_year` - szybkie filtrowanie po roku
- `idx_movies_rating` - sortowanie po ocenie
- `idx_movies_popularity` - sortowanie po popularności
- `idx_movies_polish` - filtr polskie/zagraniczne

## 🎨 Stack Technologiczny

### Frontend
- **Next.js 14** - React framework z App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animacje

### Backend
- **Next.js API Routes** - Serverless functions
- **SQLite + better-sqlite3** - Lightweight database
- **Zustand** - State management

### External
- **TMDb API** - Źródło danych filmowych

## 🔧 Konfiguracja

### Zmienne Środowiskowe
```bash
# .env.local
TMDB_API_KEY=twoj_klucz_api
```

### Dostosowanie Algorytmu

W `src/lib/recommendation-engine.ts` możesz zmienić:

```typescript
// Wagi scoringu
const GENRE_WEIGHT = 5;      // Jak ważny jest gatunek
const PACE_WEIGHT = 3;       // Jak ważne jest tempo
const MOOD_WEIGHT = 4;       // Jak ważny jest mood

// Rozmiar próbki
const TOP_MOVIES_SAMPLE = 10; // Z ilu top filmów losujemy
```

### Dostosowanie Quizu

W `src/components/Quiz/Quiz.tsx` możesz:
- Dodawać/usuwać pytania
- Zmieniać opcje odpowiedzi
- Modyfikować logikę przejść

## 📊 API Endpoints

### POST /api/recommend
Zwraca rekomendację filmu
```typescript
// Request
{
  answers: QuizAnswers,
  excludeIds: number[],
  random?: boolean
}

// Response
{
  movie: Movie,
  reasons: string[],
  score: number
}
```

### GET /api/movies
Różne operacje na filmach
```typescript
// Pobierz film po ID
GET /api/movies?id=123

// Statystyki bazy
GET /api/movies?action=stats

// Lista gatunków
GET /api/movies?action=genres

// Wyszukiwanie
GET /api/movies?genres=Komedia,Dramat&minYear=2010
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# 1. Zainstaluj Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# UWAGA: Pamiętaj załadować plik movies.db do /data w projekcie
```

### Docker
```dockerfile
# Dockerfile (przykład)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🎓 Rozszerzenia

### Możliwe Usprawnienia
1. **Konta użytkowników** - historia, ulubione
2. **Rating system** - uczenie się z feedbacku
3. **Społecznościowe** - udostępnianie list
4. **Integracje** - gdzie oglądać (Netflix, etc.)
5. **ML Model** - zaawansowany collaborative filtering
6. **A/B Testing** - optymalizacja algorytmu

### Dodatkowe Features
```typescript
// Przykład: System uczący się
interface UserFeedback {
  movieId: number;
  liked: boolean;
  timestamp: Date;
}

// Zapisuj feedback -> dostosowuj wagi
```

## 🐛 Troubleshooting

### Baza danych nie działa
```bash
# Sprawdź czy plik istnieje
ls -lh data/movies.db

# Jeśli nie, uruchom ponownie
npm run setup-db
```

### Fetch movies zwraca błędy
```bash
# Sprawdź API key
echo $TMDB_API_KEY

# Sprawdź limity API na TMDb
# Darmowy plan: 40 req/s
```

### Build errors
```bash
# Wyczyść cache
rm -rf .next node_modules
npm install
npm run dev
```

## 📝 Licencja

MIT License - możesz używać projektu jak chcesz.

## 🙏 Credits

- Dane filmowe: [The Movie Database (TMDb)](https://www.themoviedb.org/)
- Icons: Emoji (built-in)
- Fonts: Inter (Google Fonts)

## 📧 Kontakt

Pytania? Problemy? Otwórz issue na GitHubie.

---

**Made with ❤️ and Next.js in 2026**
