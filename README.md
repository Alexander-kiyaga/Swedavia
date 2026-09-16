# Swedavia FlightInfo — webbklient

En responsiv terminalinspirerad webbklient för Swedavia FlightInfo API v2. Projektet visar ankomster, avgångar, sökning på flightnummer, OData-frågor, API-hälsokontroll och en automatisk demonstration av alla endpoints.

## Kom igång

Du behöver Node.js 20+ och valfri pakethanterare. Projektet skapades ursprungligen i Lovable och innehåller även en `bun.lock`.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Öppna adressen som visas i terminalen. Utan API-nyckel startar appen automatiskt i tydligt markerat mockläge, så hela gränssnittet kan demonstreras utan att förbruka API-anrop.

## Lägg till Swedavia-nyckeln

1. Kopiera `.env.example` till `.env.local`.
2. Öppna `.env.local` och lägg in nyckeln efter likhetstecknet:

   ```dotenv
   SWEDAVIA_API_KEY=din_nyckel_här
   ```

3. Starta om utvecklingsservern.

Nyckeln används endast i serverkoden och skickas aldrig till webbläsaren. `.env.local` ignoreras av Git. I Lovable lägger du samma värde under projektets Secrets med namnet `SWEDAVIA_API_KEY`.

## Kontroller

- `1` — ankomster för vald flygplats och datum
- `2` — avgångar för vald flygplats och datum
- `3` — sök ett specifikt flightnummer
- `4` — bygg och kör en säker OData-fråga
- `5` — kör HeartBeat
- `6` — demonstrera alla endpoints i följd
- `q` — återställ gränssnittet
- `# Destinationer` — gruppera aktuella flyg efter stad och land

Kortkommandona fungerar när fokus inte ligger i ett formulärfält.

## Kvalitetskontroll

```bash
pnpm check
```

Kommandot kör TypeScript-kontroll, lintning och en produktionsbuild.

## Säkerhet

API-nyckeln ska aldrig läggas i källkoden, i en variabel med prefixet `VITE_` eller skickas i chatten. Om en nyckel har visats i en skärminspelning eller råkat checkas in bör den regenereras i Swedavias utvecklarportal.
