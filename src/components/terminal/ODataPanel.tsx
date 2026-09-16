import { useEffect, useState } from "react";

import { AIRPORT_CODES, AIRPORTS, type AirportCode } from "@/lib/airports";
import type { QueryArgs } from "@/lib/flight-types";
import { normalizeFlightNumber, previewFilter } from "@/lib/odata-preview";
import { isValidApiDate } from "@/lib/time";

export function ODataPanel({
  defaultAirport,
  defaultDate,
  onRun,
  running,
}: {
  defaultAirport: AirportCode;
  defaultDate: string;
  onRun: (args: QueryArgs) => void;
  running: boolean;
}) {
  const [airport, setAirport] = useState<AirportCode | "">(defaultAirport);
  const [flightType, setFlightType] = useState<"A" | "D" | "">("A");
  const [scheduled, setScheduled] = useState(defaultDate);
  const [flightId, setFlightId] = useState("");
  const [count, setCount] = useState(100);
  const [open, setOpen] = useState(false);

  useEffect(() => setAirport(defaultAirport), [defaultAirport]);
  useEffect(() => setScheduled(defaultDate), [defaultDate]);

  const args: QueryArgs = {};
  if (airport) args.airport = airport;
  if (flightType) args.flightType = flightType;
  if (scheduled) args.scheduled = scheduled;
  if (flightId.trim()) args.flightId = normalizeFlightNumber(flightId);
  args.count = count;
  const filter = previewFilter(args);
  const scheduledValid = !scheduled || isValidApiDate(scheduled);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onRun(args);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="od-airport" className="block text-xs text-muted-foreground">
            Flygplats
          </label>
          <select
            id="od-airport"
            value={airport}
            onChange={(e) => setAirport(e.target.value as AirportCode | "")}
            className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-foreground"
          >
            <option value="">—</option>
            {AIRPORT_CODES.map((c) => (
              <option key={c} value={c}>
                {c} — {AIRPORTS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="od-count" className="block text-xs text-muted-foreground">
            Antal (1–1000)
          </label>
          <input
            id="od-count"
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(Math.min(1000, Math.max(1, Number(e.target.value) || 1)))}
            className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-foreground"
          />
        </div>
        <div>
          <label htmlFor="od-type" className="block text-xs text-muted-foreground">
            Flygtyp
          </label>
          <select
            id="od-type"
            value={flightType}
            onChange={(e) => setFlightType(e.target.value as "A" | "D" | "")}
            className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-foreground"
          >
            <option value="">—</option>
            <option value="A">A — ankomst</option>
            <option value="D">D — avgång</option>
          </select>
        </div>
        <div>
          <label htmlFor="od-date" className="block text-xs text-muted-foreground">
            Schemalagt datum
          </label>
          <input
            id="od-date"
            type="date"
            value={scheduled}
            onChange={(e) => setScheduled(e.target.value)}
            className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-foreground"
          />
        </div>
        <div>
          <label htmlFor="od-flight" className="block text-xs text-muted-foreground">
            Flight ID
          </label>
          <input
            id="od-flight"
            value={flightId}
            placeholder="SK 1425"
            onChange={(e) => setFlightId(e.target.value)}
            className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="text-xs text-term-cyan"
        >
          {open ? "Dölj" : "Visa"} genererat filter
        </button>
        {open ? (
          <pre className="term-panel mt-2 overflow-x-auto p-3 text-xs text-muted-foreground">
            {filter || "(tomt filter — välj minst ett fält)"}
          </pre>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={running || !filter || !scheduledValid}
        className="rounded border border-primary px-3 py-1.5 text-sm text-primary disabled:opacity-40"
      >
        Kör förfrågan
      </button>
      {!scheduledValid ? (
        <p role="alert" className="text-xs text-term-red">
          Datumet är ogiltigt.
        </p>
      ) : null}
    </form>
  );
}
