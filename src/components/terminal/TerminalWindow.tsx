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
  const status = mock
    ? { dot: "bg-term-amber", text: "text-term-amber", label: "Mockdata" }
    : online === true
      ? { dot: "bg-term-green", text: "text-term-green", label: "API online" }
      : online === false
        ? { dot: "bg-term-red", text: "text-term-red", label: "API offline" }
        : { dot: "bg-muted-foreground", text: "text-muted-foreground", label: "Ej kontrollerad" };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-chrome/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-foreground sm:text-base">
              Swedavia FlightInfo
            </h1>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              API v2 · live flight information
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1.5 text-[11px] sm:text-xs"
              role="status"
              aria-live="polite"
            >
              <span className={`size-2 rounded-full ${status.dot}`} />
              <span className={status.text}>{status.label}</span>
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
      </header>
      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 text-sm sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
