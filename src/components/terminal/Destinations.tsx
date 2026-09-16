import { useMemo, useState } from "react";

import { countryForCity } from "@/lib/city-country";
import type { NormalizedFlight } from "@/lib/flight-types";

export interface DestinationRow {
  city: string;
  country: string;
  count: number;
}

export function aggregateDestinations(flights: NormalizedFlight[]): DestinationRow[] {
  const counts = new Map<string, number>();
  for (const f of flights) {
    const city = f.otherCity?.trim();
    if (!city) continue;
    counts.set(city, (counts.get(city) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([city, count]) => ({ city, country: countryForCity(city), count }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, "sv"));
}

export function Destinations({ flights }: { flights: NormalizedFlight[] }) {
  const [filter, setFilter] = useState("");
  const rows = useMemo(() => aggregateDestinations(flights), [flights]);
  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.city.toLowerCase().includes(q) || r.country.toLowerCase().includes(q),
    );
  }, [rows, filter]);

  return (
    <section aria-label="Destinationer">
      <label htmlFor="dest-filter" className="block text-xs text-muted-foreground">
        Filtrera på stad eller land
      </label>
      <input
        id="dest-filter"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mt-1 mb-3 w-full rounded border border-input bg-background px-2 py-1.5 text-foreground sm:max-w-xs"
      />
      {shown.length === 0 ? (
        <p className="text-muted-foreground" role="status">
          Inga destinationer matchar filtret.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="py-1 pr-4">
                  Stad
                </th>
                <th scope="col" className="py-1 pr-4">
                  Land
                </th>
                <th scope="col" className="py-1 text-right">
                  Flyg
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.city} className="border-t border-border">
                  <td className="py-1.5 pr-4 text-foreground">{r.city}</td>
                  <td className="py-1.5 pr-4 text-muted-foreground">{r.country}</td>
                  <td className="py-1.5 text-right text-term-cyan">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
