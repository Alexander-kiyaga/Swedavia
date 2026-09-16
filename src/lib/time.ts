export const DASH = "—";

const stockholmFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const utcFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function toStockholmTime(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return stockholmFormatter.format(d);
}

export function toUtcTime(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return utcFormatter.format(d);
}

/** "12:05 UTC / 14:05 Sthlm" */
export function formatBothTimes(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const utc = toUtcTime(iso);
  if (utc === DASH) return DASH;
  return `${utc} UTC / ${toStockholmTime(iso)} Sthlm`;
}

/** yyyy-MM-dd for a Date, in UTC. */
export function toApiDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function quickDate(kind: "nu" | "idag" | "imorgon" | "igår"): string {
  const now = new Date();
  const offset = kind === "imorgon" ? 1 : kind === "igår" ? -1 : 0;
  const d = new Date(now.getTime() + offset * 86_400_000);
  return toApiDate(d);
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidApiDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && toApiDate(parsed) === date;
}

export function isDateInWindow(date: string, now = new Date()): boolean {
  if (!isValidApiDate(date)) return false;
  const target = Date.parse(`${date}T00:00:00Z`);
  const today = Date.parse(`${toApiDate(now)}T00:00:00Z`);
  const days = (target - today) / 86_400_000;
  return days >= -7 && days <= 90;
}

/** Convert yyyy-MM-dd to the yyMMdd value required by Swedavia's OData endpoint. */
export function toODataDate(date: string): string | null {
  if (!isValidApiDate(date)) return null;
  return date.slice(2).replaceAll("-", "");
}
