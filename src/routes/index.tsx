import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Controls } from "@/components/terminal/Controls";
import { DemoPanel, type DemoStep } from "@/components/terminal/DemoPanel";
import { Destinations } from "@/components/terminal/Destinations";
import { FlightList, FlightSkeleton } from "@/components/terminal/FlightList";
import { MENU, MenuList, type MenuKey } from "@/components/terminal/MenuList";
import { ODataPanel } from "@/components/terminal/ODataPanel";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { AIRPORTS, type AirportCode, isAirportCode } from "@/lib/airports";
import type { FlightInfoResponse, NormalizedFlight, QueryArgs } from "@/lib/flight-types";
import { getFlights, heartbeat, queryFlights } from "@/lib/flightinfo.functions";
import { normalizeFlightNumber } from "@/lib/odata-preview";
import { isValidApiDate, quickDate } from "@/lib/time";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Swedavia FlightInfo API v2 — webbklient" },
      {
        name: "description",
        content:
          "Terminalklient för Swedavia FlightInfo v2: ankomster, avgångar, flightsökning, OData-förfrågan och heartbeat för tio svenska flygplatser.",
      },
      { property: "og:title", content: "Swedavia FlightInfo API v2 — webbklient" },
      {
        property: "og:description",
        content:
          "Ankomster, avgångar, flightsökning och OData-förfrågan mot Swedavia FlightInfo v2, i ett mörkt terminalgränssnitt.",
      },
    ],
  }),
  component: Index,
});

type View = MenuKey | "dest";

const AIRPORT_KEY = "swedavia.airport";

function Index() {
  const [airport, setAirport] = useState<AirportCode>("ARN");
  const [date, setDate] = useState<string>(() => quickDate("idag"));
  const [view, setView] = useState<View>("1");
  const [flightNumber, setFlightNumber] = useState("");
  const [manualResult, setManualResult] = useState<FlightInfoResponse | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [beat, setBeat] = useState<{ tone: string; text: string } | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [mock, setMock] = useState(false);
  const [demoSteps, setDemoSteps] = useState<DemoStep[]>([]);
  const [demoRunning, setDemoRunning] = useState(false);

  const callFlights = useServerFn(getFlights);
  const callQuery = useServerFn(queryFlights);
  const callHeartbeat = useServerFn(heartbeat);

  useEffect(() => {
    const stored = localStorage.getItem(AIRPORT_KEY);
    if (stored && isAirportCode(stored)) setAirport(stored.toUpperCase() as AirportCode);
  }, []);

  const chooseAirport = useCallback((code: AirportCode) => {
    setAirport(code);
    localStorage.setItem(AIRPORT_KEY, code);
  }, []);

  const direction = view === "2" ? "departures" : "arrivals";
  const listActive = view === "1" || view === "2" || view === "dest";
  const dateValid = isValidApiDate(date);

  const listQuery = useQuery({
    queryKey: ["flights", direction, airport, date],
    enabled: listActive && dateValid,
    staleTime: 60_000,
    queryFn: () => callFlights({ data: { action: direction, airport, date } }),
  });

  useEffect(() => {
    const res = listQuery.data;
    if (!res) return;
    setMock(res.ok ? res.meta.mock : res.mock);
    if (res.ok || res.kind === "notfound") setOnline(true);
    else if (res.kind !== "input") setOnline(false);
  }, [listQuery.data]);

  const listFlights: NormalizedFlight[] = useMemo(
    () => (listQuery.data?.ok ? listQuery.data.flights : []),
    [listQuery.data],
  );

  const runQueryAction = useCallback(
    async (args: QueryArgs) => {
      setManualLoading(true);
      setManualResult(null);
      try {
        const res = await callQuery({ data: { action: "query" as const, ...args } });
        setManualResult(res);
        setMock(res.ok ? res.meta.mock : res.mock);
        if (res.ok || res.kind === "notfound") setOnline(true);
        else if (res.kind !== "input") setOnline(false);
      } catch {
        setManualResult({
          ok: false,
          kind: "upstream",
          message: "Förfrågan kunde inte genomföras. Försök igen.",
          status: null,
          mock,
        });
        setOnline(false);
      } finally {
        setManualLoading(false);
      }
    },
    [callQuery, mock],
  );

  const runHeartbeat = useCallback(async () => {
    setBeat({ tone: "text-muted-foreground", text: "Kontrollerar…" });
    const res = await callHeartbeat({});
    if (res.ok) {
      setMock(res.mock);
      setOnline(true);
      setBeat({
        tone: res.status === "online" ? "text-term-green" : "text-term-amber",
        text: res.status === "online" ? `OK — ${res.message}` : `Stöds ej — ${res.message}`,
      });
    } else {
      setOnline(false);
      setBeat({ tone: "text-term-red", text: res.message });
    }
  }, [callHeartbeat]);

  const runDemo = useCallback(async () => {
    setDemoRunning(true);
    const steps: DemoStep[] = [
      { name: "heartBeat", state: "pending", detail: "" },
      { name: `arrivals ${airport} ${date}`, state: "pending", detail: "" },
      { name: `departures ${airport} ${date}`, state: "pending", detail: "" },
      { name: "query (OData)", state: "pending", detail: "" },
    ];
    setDemoSteps([...steps]);
    const update = (i: number, patch: Partial<DemoStep>) => {
      steps[i] = { ...steps[i]!, ...patch };
      setDemoSteps([...steps]);
    };

    try {
      update(0, { state: "running" });
      const hb = await callHeartbeat({});
      update(0, {
        state: hb.ok ? "success" : "error",
        detail: hb.message,
      });

      for (const [i, action] of (["arrivals", "departures"] as const).entries()) {
        update(i + 1, { state: "running" });
        const res = await callFlights({ data: { action, airport, date } });
        update(i + 1, {
          state: res.ok ? "success" : "error",
          detail: res.ok ? `${res.flights.length} flygningar` : res.message,
        });
      }

      update(3, { state: "running" });
      const q = await callQuery({
        data: {
          action: "query" as const,
          airport,
          flightType: "A" as const,
          scheduled: date,
          count: 50,
        },
      });
      update(3, {
        state: q.ok ? "success" : "error",
        detail: q.ok ? `${q.flights.length} träffar` : q.message,
      });
    } catch {
      const running = steps.findIndex((step) => step.state === "running");
      if (running >= 0) {
        update(running, { state: "error", detail: "Förfrågan kunde inte genomföras." });
      }
    } finally {
      setDemoRunning(false);
    }
  }, [airport, date, callFlights, callHeartbeat, callQuery]);

  const reset = useCallback(() => {
    setView("1");
    setManualResult(null);
    setBeat(null);
    setDemoSteps([]);
    setFlightNumber("");
  }, []);

  const onMenu = useCallback(
    (key: MenuKey) => {
      if (key === "q") {
        reset();
        return;
      }
      setManualResult(null);
      setView(key);
      if (key === "5") void runHeartbeat();
    },
    [reset, runHeartbeat],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (MENU.some((m) => m.key === key)) {
        e.preventDefault();
        onMenu(key as MenuKey);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onMenu]);

  const manualFlights = manualResult?.ok ? manualResult.flights : [];
  const errorFor = (res: FlightInfoResponse | null | undefined) =>
    res && !res.ok ? res.message : null;
  const listError =
    errorFor(listQuery.data) ??
    (listQuery.error instanceof Error ? "Flygdata kunde inte hämtas. Försök igen." : null);

  return (
    <TerminalWindow online={online} mock={mock}>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <MenuList active={view === "dest" ? null : (view as MenuKey)} onSelect={onMenu} />
          <button
            type="button"
            onClick={() => setView("dest")}
            aria-current={view === "dest" ? "true" : undefined}
            className={`w-full rounded border border-border px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
              view === "dest" ? "bg-accent" : ""
            }`}
          >
            <span className="term-key">#</span> Destinationer
          </button>
        </div>

        <div className="min-w-0 space-y-5">
          <Controls airport={airport} date={date} onAirport={chooseAirport} onDate={setDate} />

          <h2 className="text-sm text-term-cyan">
            {view === "dest"
              ? `Destinationer — ${AIRPORTS[airport]}`
              : (MENU.find((m) => m.key === view)?.label ?? "")}
          </h2>

          {mock ? (
            <p className="rounded border border-term-amber/40 px-2 py-1 text-xs text-term-amber">
              Mockdata visas — ingen API-nyckel är konfigurerad. Detta är inte live-data.
            </p>
          ) : null}

          {listActive && !dateValid ? (
            <p role="alert" className="text-term-red">
              Välj ett giltigt datum.
            </p>
          ) : null}

          {(view === "1" || view === "2") && (
            <>
              {listQuery.isPending ? <FlightSkeleton /> : null}
              {listError ? (
                <div role="alert" className="term-panel space-y-2 p-4">
                  <p className="text-term-red">{listError}</p>
                  <button
                    type="button"
                    onClick={() => void listQuery.refetch()}
                    className="rounded border border-border px-2 py-1 text-xs text-term-cyan"
                  >
                    Försök igen
                  </button>
                </div>
              ) : null}
              {listQuery.data?.ok ? (
                <FlightList
                  flights={listFlights}
                  meta={listQuery.data.meta}
                  title={direction === "arrivals" ? "Ankomster" : "Avgångar"}
                />
              ) : null}
            </>
          )}

          {view === "3" && (
            <div className="space-y-4">
              <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void runQueryAction({
                    flightId: normalizeFlightNumber(flightNumber),
                    count: 1000,
                  });
                }}
              >
                <div>
                  <label htmlFor="flight-no" className="block text-xs text-muted-foreground">
                    Flightnummer
                  </label>
                  <input
                    id="flight-no"
                    value={flightNumber}
                    placeholder="SK 1425"
                    onChange={(e) => setFlightNumber(e.target.value)}
                    className="mt-1 rounded border border-input bg-background px-2 py-1.5 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="submit"
                  disabled={manualLoading || !flightNumber.trim()}
                  className="rounded border border-primary px-3 py-1.5 text-sm text-primary disabled:opacity-40"
                >
                  Sök
                </button>
              </form>
              {manualLoading ? <FlightSkeleton /> : null}
              {errorFor(manualResult) ? (
                <p role="alert" className="text-term-red">
                  {errorFor(manualResult)}
                </p>
              ) : null}
              {manualResult?.ok ? (
                <FlightList flights={manualFlights} meta={manualResult.meta} title="Sökresultat" />
              ) : null}
            </div>
          )}

          {view === "4" && (
            <div className="space-y-4">
              <ODataPanel
                defaultAirport={airport}
                defaultDate={date}
                running={manualLoading}
                onRun={(args) => void runQueryAction(args)}
              />
              {manualLoading ? <FlightSkeleton /> : null}
              {errorFor(manualResult) ? (
                <p role="alert" className="text-term-red">
                  {errorFor(manualResult)}
                </p>
              ) : null}
              {manualResult?.ok ? (
                <FlightList
                  flights={manualFlights}
                  meta={manualResult.meta}
                  title="OData-resultat"
                />
              ) : null}
            </div>
          )}

          {view === "5" && (
            <div className="space-y-3">
              <p className={beat?.tone ?? "text-muted-foreground"} aria-live="polite">
                {beat?.text ?? "Ingen kontroll körd ännu."}
              </p>
              <button
                type="button"
                onClick={() => void runHeartbeat()}
                className="rounded border border-primary px-3 py-1.5 text-sm text-primary"
              >
                Kör HeartBeat
              </button>
            </div>
          )}

          {view === "6" && (
            <DemoPanel steps={demoSteps} running={demoRunning} onRun={() => void runDemo()} />
          )}

          {view === "dest" && (
            <div className="space-y-3">
              {listQuery.isPending ? <FlightSkeleton /> : null}
              {listError ? (
                <div role="alert" className="term-panel space-y-2 p-4">
                  <p className="text-term-red">{listError}</p>
                  <button
                    type="button"
                    onClick={() => void listQuery.refetch()}
                    className="rounded border border-border px-2 py-1 text-xs text-term-cyan"
                  >
                    Försök igen
                  </button>
                </div>
              ) : null}
              {listQuery.data?.ok ? <Destinations flights={listFlights} /> : null}
            </div>
          )}
        </div>
      </div>
    </TerminalWindow>
  );
}
