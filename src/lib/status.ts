export type StatusTone = "neutral" | "amber" | "cyan" | "green" | "red";

const TONES: Record<string, StatusTone> = {
  FPL: "amber",
  SEQ: "amber",
  SCH: "amber",
  ACT: "cyan",
  APR: "cyan",
  LAN: "green",
  ARR: "green",
  DEP: "green",
  CAN: "red",
  DEL: "red",
  CNL: "red",
  DELETED: "red",
  RER: "amber",
  DIV: "red",
  SUS: "amber",
};

export function statusTone(code: string | null, text?: string | null): StatusTone {
  const key = (code ?? "").toUpperCase();
  if (TONES[key]) return TONES[key];
  const t = (text ?? "").toLowerCase();
  if (t.includes("inställ") || t.includes("cancel")) return "red";
  if (t.includes("landat") || t.includes("landed") || t.includes("avgått")) return "green";
  if (t.includes("aktiv") || t.includes("active")) return "cyan";
  if (t.includes("försen") || t.includes("delay")) return "amber";
  return "neutral";
}

export const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "text-muted-foreground",
  amber: "text-term-amber",
  cyan: "text-term-cyan",
  green: "text-term-green",
  red: "text-term-red",
};
