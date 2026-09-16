import { useMemo, useState } from "react";

import { AIRPORTS, type AirportCode, resolveAirport, searchAirports } from "@/lib/airports";
import { quickDate } from "@/lib/time";

interface Props {
  airport: AirportCode;
  date: string;
  onAirport: (code: AirportCode) => void;
  onDate: (date: string) => void;
}

const QUICK: Array<"nu" | "idag" | "imorgon" | "igår"> = ["nu", "idag", "imorgon", "igår"];

export function Controls({ airport, date, onAirport, onDate }: Props) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => searchAirports(query), [query]);
  const dateRange = useMemo(() => {
    const now = new Date();
    const min = new Date(now.getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
    const max = new Date(now.getTime() + 90 * 86_400_000).toISOString().slice(0, 10);
    return { min, max };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="airport-search" className="block text-xs text-muted-foreground">
          Flygplats (IATA-kod eller ort)
        </label>
        <input
          id="airport-search"
          value={query}
          placeholder={`${airport} — ${AIRPORTS[airport]}`}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const found = resolveAirport(query);
              if (found) {
                onAirport(found);
                setQuery("");
              }
            }
          }}
          className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-foreground placeholder:text-muted-foreground"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {matches.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                onAirport(code);
                setQuery("");
              }}
              aria-pressed={code === airport}
              className={`rounded border px-2 py-1 text-xs transition-colors ${
                code === airport
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {code} <span className="hidden sm:inline">{AIRPORTS[code]}</span>
            </button>
          ))}
          {matches.length === 0 ? (
            <span className="text-xs text-term-red">Ingen flygplats matchar sökningen.</span>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="date-input" className="block text-xs text-muted-foreground">
          Datum (UTC, yyyy-MM-dd)
        </label>
        <input
          id="date-input"
          type="date"
          value={date}
          min={dateRange.min}
          max={dateRange.max}
          onChange={(e) => onDate(e.target.value)}
          className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-foreground"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onDate(quickDate(q))}
              className="rounded border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
