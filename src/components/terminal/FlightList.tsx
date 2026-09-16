import { useEffect, useState } from "react";

import type { FlightInfoMeta, NormalizedFlight } from "@/lib/flight-types";
import { TONE_CLASS, statusTone } from "@/lib/status";
import { DASH, formatBothTimes } from "@/lib/time";

export const PAGE_SIZE = 50;

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="truncate text-foreground">{value && value.trim() ? value : DASH}</dd>
    </div>
  );
}

function FlightCard({ flight }: { flight: NormalizedFlight }) {
  const tone = statusTone(flight.statusCode, flight.statusText);
  return (
    <li className="term-panel p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-bold text-foreground">
          {flight.flightId}{" "}
          <span className="font-normal text-muted-foreground">
            {flight.airlineName ?? DASH}
            {flight.airlineIata ? ` (${flight.airlineIata})` : ""}
          </span>
        </h3>
        <span className={TONE_CLASS[tone]}>{flight.statusText ?? flight.statusCode ?? DASH}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        <span className="text-foreground">{flight.from ?? DASH}</span>
        {" → "}
        <span className="text-foreground">{flight.to ?? DASH}</span>
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Terminal" value={flight.terminal} />
        <Field label="Gate" value={flight.gate} />
        {flight.direction === "arrivals" ? (
          <Field label="Bagageband" value={flight.baggageBelt} />
        ) : (
          <Field label="Incheckning" value={flight.checkIn} />
        )}
        <Field label="Schemalagd" value={formatBothTimes(flight.scheduledUtc)} />
        <Field label="Beräknad" value={formatBothTimes(flight.estimatedUtc)} />
        <Field label="Faktisk" value={formatBothTimes(flight.actualUtc)} />
        <Field label="Typ" value={flight.locationType} />
        <Field label="Via" value={flight.via.length ? flight.via.join(", ") : null} />
        <Field label="Anmärkningar" value={flight.remarks.length ? flight.remarks.join("; ") : null} />
      </dl>
    </li>
  );
}

export function FlightSkeleton() {
  return (
    <ul className="space-y-2" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="term-panel h-28 animate-pulse bg-muted/60" />
      ))}
    </ul>
  );
}

interface Props {
  flights: NormalizedFlight[];
  meta: FlightInfoMeta | null;
  title: string;
}

export function FlightList({ flights, meta, title }: Props) {
  const [page, setPage] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setPage(0);
    setShowAll(false);
  }, [flights]);

  if (!flights.length) {
    return (
      <p className="term-panel p-4 text-muted-foreground" role="status">
        Inga flygningar hittades för valet.
      </p>
    );
  }

  const pageCount = Math.ceil(flights.length / PAGE_SIZE);
  const visible = showAll ? flights : flights.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const shown = showAll ? flights.length : Math.min((page + 1) * PAGE_SIZE, flights.length);
  const left = flights.length - shown;

  return (
    <section aria-label={title}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <p role="status" aria-live="polite" className="text-muted-foreground">
          Visar {shown}/{flights.length} ({left} kvar)
          {meta?.lastModified ? ` · uppdaterad ${meta.lastModified}` : ""}
          {meta?.lastModifiedInMinutes ? ` (${meta.lastModifiedInMinutes} min)` : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={showAll || page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded border border-border px-2 py-1 text-muted-foreground disabled:opacity-40 hover:not-disabled:text-foreground"
          >
            Föregående
          </button>
          <span className="text-muted-foreground">
            {showAll ? "alla" : `${page + 1}/${pageCount}`}
          </span>
          <button
            type="button"
            disabled={showAll || page >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded border border-border px-2 py-1 text-muted-foreground disabled:opacity-40 hover:not-disabled:text-foreground"
          >
            Nästa
          </button>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded border border-border px-2 py-1 text-term-cyan"
          >
            {showAll ? "Sidvis" : "Visa alla"}
          </button>
        </div>
      </div>
      <ul className="space-y-2">
        {visible.map((f, i) => (
          <FlightCard key={`${f.flightId}-${f.scheduledUtc}-${i}`} flight={f} />
        ))}
      </ul>
    </section>
  );
}
