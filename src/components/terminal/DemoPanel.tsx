import { TONE_CLASS } from "@/lib/status";

export interface DemoStep {
  name: string;
  state: "pending" | "running" | "success" | "error";
  detail: string;
}

export function DemoPanel({
  steps,
  running,
  onRun,
}: {
  steps: DemoStep[];
  running: boolean;
  onRun: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Kör en icke-destruktiv sekvens mot vald flygplats och datum: heartbeat, ankomster, avgångar
        och en OData-förfrågan. Ingen automatisk upprepning.
      </p>
      <button
        type="button"
        onClick={onRun}
        disabled={running}
        className="rounded border border-primary px-3 py-1.5 text-sm text-primary disabled:opacity-40"
      >
        {running ? "Kör…" : "Starta demo"}
      </button>
      <ul className="space-y-1 text-xs" aria-live="polite">
        {steps.map((s) => (
          <li key={s.name} className="term-panel flex flex-wrap gap-2 p-2">
            <span className="text-foreground">{s.name}</span>
            <span
              className={
                s.state === "success"
                  ? TONE_CLASS.green
                  : s.state === "error"
                    ? TONE_CLASS.red
                    : s.state === "running"
                      ? TONE_CLASS.cyan
                      : TONE_CLASS.neutral
              }
            >
              {s.state === "pending"
                ? "väntar"
                : s.state === "running"
                  ? "kör"
                  : s.state === "success"
                    ? "ok"
                    : "fel"}
            </span>
            <span className="text-muted-foreground">{s.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
