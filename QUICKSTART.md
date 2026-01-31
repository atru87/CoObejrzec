# ⚡ Quick Start Guide

## Minimalna Ścieżka: 0 → Running w 15 minut

### Krok 1: Przygotowanie (2 min)

```bash
# Sklonuj projekt
git clone <repo-url>
cd film-match

# Zainstaluj zależności
npm install
```

### Krok 2: Uzyskaj TMDb API Key (3 min)

1. Idź na https://www.themoviedb.org/signup
2. Załóż darmowe konto
3. Przejdź do Settings → API
4. Skopiuj "API Key (v3 auth)"

```bash
# Utwórz plik .env.local
echo "TMDB_API_KEY=twoj_klucz" > .env.local
```

### Krok 3: Pobierz Bazę Filmów (10 min)

```bash
# Pobierz ~15,000 filmów z TMDb
# To zajmie około 10 minut
npm run fetch-movies

# Zainicjalizuj bazę SQLite
npm run setup-db
```

**Komunikaty które zobaczysz:**
```
🎬 Rozpoczynam pobieranie filmów z TMDB...
✓ Pobrano 1000/15000 filmów
✓ Pobrano 2000/15000 filmów
...
✅ Pobrano 15000 filmów
💾 Zapisano do: data/movies-raw.json

🗄️  Tworzę bazę danych SQLite...
✓ Utworzono tabele i indeksy
💾 Importuję filmy do bazy...
✅ Zaimportowano 15000 filmów

📊 Statystyki bazy:
   Filmów: 15000
   Gatunków: 19
   Średnia ocena: 7.2/10
```

### Krok 4: Uruchom Aplikację (< 1 min)

```bash
npm run dev
```

Otwórz http://localhost:3000 🎉

## Szybkie Problemy i Rozwiązania

### Problem: "Command not found: node"
```bash
# Zainstaluj Node.js 18+
# macOS
brew install node

# Windows
# Pobierz z https://nodejs.org

# Linux
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Problem: "TMDB_API_KEY is not set"
```bash
# Sprawdź czy plik istnieje
cat .env.local

# Jeśli nie istnieje
echo "TMDB_API_KEY=twoj_prawdziwy_klucz" > .env.local

# Na Windows CMD użyj:
echo TMDB_API_KEY=twoj_klucz > .env.local

# Upewnij się że nie ma spacji wokół =
```

### Problem: "Database file not found"
```bash
# Sprawdź czy pliki istnieją
ls -lh data/

# Jeśli brakuje movies-raw.json
npm run fetch-movies

# Jeśli brakuje movies.db
npm run setup-db
```

### Problem: "Port 3000 already in use"
```bash
# Użyj innego portu
PORT=3001 npm run dev

# Lub zabij proces na porcie 3000
# macOS/Linux
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Weryfikacja Instalacji

### Test 1: Sprawdź bazę
```bash
# Powinna pokazać ~15000 filmów
npm run check-db
```

Jeśli ten skrypt nie istnieje, dodaj do package.json:
```json
"check-db": "node -e \"const db=require('better-sqlite3')('data/movies.db');console.log('Filmów:',db.prepare('SELECT COUNT(*) as c FROM movies').get().c)\""
```

### Test 2: Sprawdź API
```bash
# Powinno zwrócić dane filmu
curl http://localhost:3000/api/movies?id=550

# Powinno zwrócić rekomendację
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"answers":{"genres":["Komedia"],"era":"any","origin":"any","pace":"any","mood":[],"popularity":"any","runtime":"any"},"excludeIds":[]}'
```

### Test 3: Sprawdź Frontend
1. Otwórz http://localhost:3000
2. Kliknij "Zacznij quiz"
3. Odpowiedz na wszystkie pytania
4. Powinieneś zobaczyć kartę filmu

## Opcjonalne: Testowa Baza (Jeśli nie chcesz czekać 10 min)

Stwórz testową bazę z 100 filmami:

```bash
# Edytuj scripts/fetch-movies.js
# Zmień linię:
fetchMovies(15000)
# Na:
fetchMovies(100)

# Uruchom
npm run fetch-movies
npm run setup-db
```

## Deployment na Vercel (5 min)

```bash
# 1. Zainstaluj Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# Gotowe! Aplikacja jest online
```

**WAŻNE**: Pamiętaj przesłać `data/movies.db` do repozytorium lub użyć innej strategii dla production (np. PostgreSQL).

## Struktura Folderów Po Instalacji

```
film-match/
├── data/
│   ├── movies-raw.json      (~50MB)
│   ├── movies.db            (~80MB)
│   ├── movies.db-shm        (temp)
│   └── movies.db-wal        (temp)
├── node_modules/            (~200MB)
├── .next/                   (~100MB)
└── ... (reszta kodu)

Total: ~430MB
```

## Co Dalej?

### Rozwój
- Czytaj `README.md` dla pełnej dokumentacji
- Czytaj `ARCHITECTURE.md` dla szczegółów technicznych
- Eksperymentuj z `src/lib/recommendation-engine.ts`

### Customizacja
- Zmień kolory w `tailwind.config.js`
- Dodaj pytania w `src/components/Quiz/Quiz.tsx`
- Dostosuj scoring w `recommendation-engine.ts`

### Production
- Skonfiguruj Analytics (Vercel/Google)
- Dodaj Error Tracking (Sentry)
- Optymalizuj obrazy (next/image)
- Dodaj testy (Jest + Playwright)

## Potrzebujesz Pomocy?

1. **Dokumentacja**: Przeczytaj README.md
2. **Issues**: Zgłoś problem na GitHubie
3. **Community**: Dołącz do dyskusji

---

**Happy coding! 🚀**
