export const AIRPORTS = {
  ARN: "Stockholm Arlanda",
  GOT: "Göteborg Landvetter",
  BMA: "Bromma Stockholm",
  MMX: "Malmö",
  LLA: "Luleå",
  UME: "Umeå",
  OSD: "Åre Östersund",
  VBY: "Visby",
  RNB: "Ronneby",
  KRN: "Kiruna",
} as const;

export type AirportCode = keyof typeof AIRPORTS;

export const AIRPORT_CODES = Object.keys(AIRPORTS) as AirportCode[];

const ALIASES: Record<string, AirportCode> = {
  stockholm: "ARN",
  arlanda: "ARN",
  goteborg: "GOT",
  göteborg: "GOT",
  gothenburg: "GOT",
  landvetter: "GOT",
  bromma: "BMA",
  malmo: "MMX",
  malmö: "MMX",
  lulea: "LLA",
  luleå: "LLA",
  umea: "UME",
  umeå: "UME",
  ostersund: "OSD",
  östersund: "OSD",
  are: "OSD",
  åre: "OSD",
  visby: "VBY",
  gotland: "VBY",
  ronneby: "RNB",
  kiruna: "KRN",
};

export function isAirportCode(value: unknown): value is AirportCode {
  return typeof value === "string" && value.toUpperCase() in AIRPORTS;
}

/** Resolve a free-text query (IATA code, city or airport name) to an airport code. */
export function resolveAirport(query: string): AirportCode | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  if (isAirportCode(q)) return q.toUpperCase() as AirportCode;
  if (ALIASES[q]) return ALIASES[q];
  const byName = AIRPORT_CODES.find((code) => AIRPORTS[code].toLowerCase() === q);
  if (byName) return byName;
  const partial = AIRPORT_CODES.find((code) => AIRPORTS[code].toLowerCase().includes(q));
  return partial ?? null;
}

/** Filter airports for a picker, matching code or name case-insensitively. */
export function searchAirports(query: string): AirportCode[] {
  const q = query.trim().toLowerCase();
  if (!q) return AIRPORT_CODES;
  return AIRPORT_CODES.filter(
    (code) => code.toLowerCase().includes(q) || AIRPORTS[code].toLowerCase().includes(q),
  );
}
