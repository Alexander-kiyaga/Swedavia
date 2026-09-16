# Swedavia FlightInfo — Web Client

A responsive, terminal-inspired web client for the Swedavia FlightInfo API v2. The application displays arrivals, departures, flight-number searches, OData queries, API health checks, and an automated demonstration of all endpoints.

## Getting started

You need Node.js 20 or later and a package manager. The project was originally created in Lovable and also includes a `bun.lock` file.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open the address displayed in the terminal. Without an API key, the application automatically starts in a clearly labelled mock mode, allowing the complete interface to be demonstrated without consuming API requests.

## Add the Swedavia API key

1. Copy `.env.example` to `.env.local`.
2. Open `.env.local` and enter the key after the equals sign:

   ```dotenv
   SWEDAVIA_API_KEY=your_key_here
   ```

3. Restart the development server.

The key is used only by the server code and is never sent to the browser. `.env.local` is ignored by Git. In Lovable, add the same value to the project's Secrets using the name `SWEDAVIA_API_KEY`.

## Controls

- `1` — arrivals for the selected airport and date
- `2` — departures for the selected airport and date
- `3` — search for a specific flight number
- `4` — build and run a validated OData query
- `5` — run the HeartBeat health check
- `6` — demonstrate all endpoints in sequence
- `q` — reset the interface
- `# Destinationer` — group current flights by city and country

Keyboard shortcuts work whenever focus is not inside a form field.

## Quality checks

```bash
pnpm check
```

This command runs the automated verification script, TypeScript checks, linting, and a production build.

## Security

Never place the API key in source code, expose it through a variable prefixed with `VITE_`, or send it in chat. If a key has appeared in a screen recording or was accidentally committed, regenerate it through the Swedavia Developer Portal.
