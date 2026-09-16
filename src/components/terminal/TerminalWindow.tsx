import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";

import { useTheme } from "@/hooks/use-theme";

interface Props {
  online: boolean | null;
  mock: boolean;
  children: ReactNode;
}

export function TerminalWindow({ online, mock, children }: Props) {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-[1180px] overflow-hidden rounded-xl border border-border shadow-2xl">
        <div className="flex flex-wrap items-center gap-2 bg-chrome px-3 py-2 sm:px-4">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-3 rounded-full bg-term-red/80" />
            <span className="size-3 rounded-full bg-term-amber/80" />
            <span className="size-3 rounded-full bg-term-green/80" />
          </div>
          <h1 className="min-w-0 flex-1 truncate px-2 text-center text-xs text-muted-foreground sm:text-sm">
            Swedavia FlightInfo API v2 — webbklient
          </h1>
          <div className="flex items-center gap-3">
            {mock ? (
              <span className="rounded border border-term-amber/50 px-1.5 py-0.5 text-[10px] tracking-wide text-term-amber uppercase">
                Mockläge
              </span>
            ) : null}
            <span
              className="flex items-center gap-1.5 text-[11px] sm:text-xs"
              role="status"
              aria-live="polite"
            >
              <span
                className={`size-2 rounded-full ${online === false ? "bg-term-red" : "bg-term-green"}`}
              />
              <span className={online === false ? "text-term-red" : "text-term-green"}>
                {online === false ? "API offline" : "API online"}
              </span>
            </span>
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === "dark" ? "Byt till ljust tema" : "Byt till mörkt tema"}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
        <div className="bg-card p-3 text-sm sm:p-6">{children}</div>
      </div>
    </div>
  );
}
