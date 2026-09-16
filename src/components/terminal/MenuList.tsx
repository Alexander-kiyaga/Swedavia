export type MenuKey = "1" | "2" | "3" | "4" | "5" | "6" | "q";

export const MENU: Array<{ key: MenuKey; label: string }> = [
  { key: "1", label: "Ankomster (arrivals) för en flygplats & datum" },
  { key: "2", label: "Avgångar (departures) för en flygplats & datum" },
  { key: "3", label: "Sök specifikt flightnummer" },
  { key: "4", label: "OData-förfrågan (query endpoint)" },
  { key: "5", label: "HeartBeat — hälsokontroll av API" },
  { key: "6", label: "Demonstrera alla endpoints automatiskt" },
  { key: "q", label: "Avsluta / återställ" },
];

export function MenuList({
  active,
  onSelect,
}: {
  active: MenuKey | null;
  onSelect: (key: MenuKey) => void;
}) {
  return (
    <nav aria-label="Huvudmeny">
      <ul className="space-y-1">
        {MENU.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => onSelect(item.key)}
              aria-current={active === item.key ? "true" : undefined}
              className={`w-full rounded px-2 py-1.5 text-left transition-colors hover:bg-accent ${
                active === item.key ? "bg-accent" : ""
              }`}
            >
              <span className="term-key">{item.key}.</span>{" "}
              <span className="text-foreground">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Tips: tryck 1–6 eller q på tangentbordet när markören inte står i ett fält.
      </p>
    </nav>
  );
}
