# Migracja na Vercel Postgres

## Krok 1: Deploy na Vercel (bez bazy)

1. **Push na GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/atru87/CoObejrzec.git
git push -u origin main
```

2. **Import na Vercel:**
- Idź na https://vercel.com
- "Add New Project"
- Import z GitHub
- Deploy (na razie się wywali bo brak bazy - OK!)

## Krok 2: Dodaj Vercel Postgres

1. W projekcie na Vercel → **Storage** tab
2. **Create Database** → **Postgres**
3. Wybierz region (Frankfurt)
4. Create

## Krok 3: Podłącz zmienne środowiskowe

Vercel automatycznie doda do projektu:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

## Krok 4: Migracja danych (lokalnie)

1. **Zainstaluj Vercel CLI:**
```bash
npm i -g vercel
vercel login
vercel link
```

2. **Pobierz zmienne środowiskowe:**
```bash
vercel env pull .env.local
```

3. **Uruchom migrację:**
```bash
node scripts/migrate-to-postgres.js
```

To zajmie ~5-10 minut dla 15k filmów.

## Krok 5: Zmień db.ts

**Zastąp** `src/lib/db.ts` przez `src/lib/db-postgres.ts`:

```bash
# Windows
move src\lib\db.ts src\lib\db-sqlite-backup.ts
move src\lib\db-postgres.ts src\lib\db.ts

# Mac/Linux
mv src/lib/db.ts src/lib/db-sqlite-backup.ts
mv src/lib/db-postgres.ts src/lib/db.ts
```

## Krok 6: Aktualizuj API routes

Wszystkie funkcje DB są teraz **async**, więc zmień:

**Przed:**
```typescript
const movie = getMovieById(id);
```

**Po:**
```typescript
const movie = await getMovieById(id);
```

To samo w:
- `src/app/api/movies/route.ts`
- `src/app/api/recommend/route.ts`
- `src/lib/recommendation-engine.ts` (zmień searchMovies na async)

## Krok 7: Push i deploy

```bash
git add .
git commit -m "Migrate to Vercel Postgres"
git push
```

Vercel automatycznie zrobi redeploy.

## Krok 8: Testuj

Sprawdź https://twoja-domena.vercel.app

---

## Troubleshooting

**Błąd: "Module not found: @vercel/postgres"**
- Upewnij się że `package.json` ma: `"@vercel/postgres": "^0.5.0"`

**Migracja się wywala:**
- Zwiększ timeout w Vercel Settings
- Lub migruj w mniejszych batchach (zmień `batchSize = 50`)

**Wolne zapytania:**
- Sprawdź czy indeksy są utworzone
- Vercel Postgres Free tier ma limity - rozważ upgrade

---

## Następne kroki

Po udanej migracji możesz:
1. Usunąć `data/movies.db` (backup lokalnie!)
2. Usunąć `better-sqlite3` z `package.json`
3. Używać Vercel Analytics do monitoringu
