import { AIRPORTS, type AirportCode, isAirportCode } from "./airports";
import { DATE_RE, isDateInWindow } from "./time";
import type {
  FlightDirection,
  FlightInfoFailure,
  FlightInfoResponse,
  HeartbeatResponse,
  NormalizedFlight,
  QueryArgs,
} from "./flight-types";
import { isValidFlight, sortByScheduled } from "./flight-types";
import { buildMockFlights } from "./mock-flights.server";

const BASE_URL = "https://api.swedavia.se/flightinfo/v2";
const TIMEOUT_MS = 12_000;

export const FLIGHT_ID_RE = /^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/;

function fail(
  kind: FlightInfoFailure["kind"],
  message: string,
  status: number | null,
  mock = false,
): FlightInfoFailure {
  return { ok: false, kind, message, status, mock };
}

function pick(obj: unknown, ...keys: string[]): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) if (rec[k] !== undefined && rec[k] !== null && rec[k] !== "") return rec[k];
  return undefined;
}

function str(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}

const DI_LABEL: Record<string, string> = {
  D: "Inrikes",
  I: "Internationell",
  S: "Schengen",
};

export function normalizeFlight(raw: unknown, direction: FlightDirection): NormalizedFlight {
  const r = (raw ?? {}) as Record<string, unknown>;
  const airline = (pick(r, "airlineOperator") ?? {}) as Record<string, unknown>;
  const status = (pick(r, "locationAndStatus") ?? {}) as Record<string, unknown>;
  const baggage = (pick(r, "baggage") ?? {}) as Record<string, unknown>;
  const times = (pick(r, "arrivalTime", "departureTime") ?? {}) as Record<string, unknown>;
  const leg = (pick(r, "flightLegIdentifier") ?? {}) as Record<string, unknown>;

  const otherCity =
    direction === "arrivals"
      ? str(pick(r, "departureAirportSwedish", "departureAirportEnglish"))
      : str(pick(r, "arrivalAirportSwedish", "arrivalAirportEnglish"));
  const otherIata =
    direction === "arrivals"
      ? str(pick(leg, "departureAirportIata"))
      : str(pick(leg, "arrivalAirportIata"));
  const localIata =
    direction === "arrivals"
      ? str(pick(leg, "arrivalAirportIata"))
      : str(pick(leg, "departureAirportIata"));
  const localName =
    (localIata && localIata.toUpperCase() in AIRPORTS
      ? AIRPORTS[localIata.toUpperCase() as AirportCode]
      : null) ??
    localIata ??
    str(pick(r, "airportSwedish", "airportEnglish"));

  const viaRaw = pick(r, "viaDestinations");
  const via = Array.isArray(viaRaw)
    ? viaRaw
        .map((v) =>
          typeof v === "string"
            ? v
            : (str(pick(v, "airportSwedish", "airportEnglish", "iata")) ?? null),
        )
        .filter((v): v is string => Boolean(v))
    : [];

  const remarksRaw = pick(r, "remarksSwedish", "remarksEnglish", "remarks");
  const remarks = Array.isArray(remarksRaw)
    ? remarksRaw
        .map((v) =>
          typeof v === "string" ? v : (str(pick(v, "remarkSwedish", "remarkEnglish", "remark")) ?? null),
        )
        .filter((v): v is string => Boolean(v))
    : [];

  const di = str(pick(r, "diIndicator"));

  return {
    flightId: str(pick(r, "flightId")) ?? "",
    airlineName: str(pick(airline, "name")),
    airlineIata: str(pick(airline, "iata")),
    from: direction === "arrivals" ? otherCity : localName,
    fromIata: direction === "arrivals" ? otherIata : localIata,
    to: direction === "arrivals" ? localName : otherCity,
    toIata: direction === "arrivals" ? localIata : otherIata,
    otherCity,
    statusCode: str(pick(status, "flightLegStatus")),
    statusText:
      str(pick(status, "flightLegStatusSwedish", "flightLegStatusEnglish")) ??
      str(pick(status, "flightLegStatus")),
    terminal: str(pick(status, "terminal")),
    gate: str(pick(status, "gate")),
    baggageBelt:
      str(pick(baggage, "belt", "baggageSlot", "id")) ??
      str(pick(status, "baggageSlot", "baggageBelt")),
    checkIn:
      str(pick(r, "checkIn")) ??
      str(pick(pick(r, "checkIn") as object, "checkInStatus", "checkInCounter")) ??
      str(pick(status, "checkInStatus", "checkin")),
    scheduledUtc: str(pick(times, "scheduledUtc")),
    estimatedUtc: str(pick(times, "estimatedUtc")),
    actualUtc: str(pick(times, "actualUtc")),
    locationType: di ? (DI_LABEL[di.toUpperCase()] ?? di) : null,
    via,
    remarks,
    direction,
  };
}

function extractFlights(payload: unknown, direction: FlightDirection): unknown[] {
  if (Array.isArray(payload)) return payload;
  const p = (payload ?? {}) as Record<string, unknown>;
  const key = direction === "arrivals" ? "flights" : "flights";
  const list = p[key] ?? p["arrivals"] ?? p["departures"] ?? p["value"] ?? p["result"];
  return Array.isArray(list) ? list : [];
}

async function callSwedavia(path: string, apiKey: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${BASE_URL}${path}`, {
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function mapHttpError(status: number): FlightInfoFailure {
  if (status === 401 || status === 403)
    return fail("auth", "API-nyckeln saknas eller är ogiltig (401/403).", status);
  if (status === 429) return fail("quota", "Kvot eller hastighetsgräns nådd (429).", status);
  if (status === 404) return fail("notfound", "Resursen hittades inte (404).", status);
  return fail("upstream", `Swedavia svarade med fel (${status}).`, status);
}

export function getApiKey(): string | null {
  const key = process.env["SWEDAVIA_API_KEY"];
  return key && key.trim() ? key.trim() : null;
}

export function validateFlights(
  raw: unknown,
  direction: FlightDirection,
): NormalizedFlight[] {
  return sortByScheduled(
    extractFlights(raw, direction)
      .map((f) => normalizeFlight(f, direction))
      .filter(isValidFlight),
  );
}

/** Build a safe OData filter from whitelisted fields only. */
export function buildFilter(args: QueryArgs): string | null {
  const parts: string[] = [];
  if (args.airport) {
    if (!isAirportCode(args.airport)) return null;
    parts.push(`airport eq '${args.airport}'`);
  }
  if (args.flightType) {
    if (args.flightType !== "A" && args.flightType !== "D") return null;
    parts.push(`flightType eq '${args.flightType}'`);
  }
  if (args.scheduled) {
    if (!DATE_RE.test(args.scheduled)) return null;
    parts.push(`scheduled eq '${args.scheduled}'`);
  }
  if (args.flightId) {
    const id = args.flightId.trim().toUpperCase().replace(/\s+/g, " ");
    if (!FLIGHT_ID_RE.test(id)) return null;
    parts.push(`flightId eq '${id.replace(/'/g, "''")}'`);
  }
  if (!parts.length) return null;
  return parts.length === 1 ? parts[0]! : `(${parts.join(" and ")})`;
}

export function clampCount(count: unknown): number {
  const n = typeof count === "number" ? Math.floor(count) : 100;
  if (!Number.isFinite(n)) return 100;
  return Math.min(1000, Math.max(1, n));
}

export async function fetchFlights(
  direction: FlightDirection,
  airport: AirportCode,
  date: string,
): Promise<FlightInfoResponse> {
  if (!isAirportCode(airport)) return fail("input", "Ogiltig flygplats.", null);
  if (!isDateInWindow(date))
    return fail("input", "Ogiltigt datum (yyyy-MM-dd, ca 7 dagar bakåt till 90 framåt).", null);

  const apiKey = getApiKey();
  if (!apiKey) {
    const flights = buildMockFlights(direction, airport, date);
    return {
      ok: true,
      meta: {
        lastModified: new Date().toISOString(),
        lastModifiedInMinutes: "0",
        continuationToken: null,
        mock: true,
      },
      flights,
    };
  }

  try {
    const res = await callSwedavia(`/${airport}/${direction}/${date}`, apiKey);
    if (!res.ok) return mapHttpError(res.status);
    const json = await res.json();
    return {
      ok: true,
      meta: {
        lastModified: res.headers.get("Last-Modified"),
        lastModifiedInMinutes: res.headers.get("Last-Modified-InMinutes"),
        continuationToken: res.headers.get("x-continuation-token"),
        mock: false,
      },
      flights: validateFlights(json, direction),
    };
  } catch (err) {
    if ((err as Error)?.name === "AbortError")
      return fail("timeout", "Förfrågan tog för lång tid (timeout).", null);
    return fail("upstream", "Kunde inte nå Swedavia.", null);
  }
}

export async function runQuery(args: QueryArgs): Promise<FlightInfoResponse> {
  const filter = buildFilter(args);
  if (!filter) return fail("input", "Ogiltig eller tom OData-förfrågan.", null);
  const direction: FlightDirection = args.flightType === "D" ? "departures" : "arrivals";
  const count = clampCount(args.count);

  const apiKey = getApiKey();
  if (!apiKey) {
    const airport = (args.airport ?? "ARN") as AirportCode;
    const date = args.scheduled ?? new Date().toISOString().slice(0, 10);
    let flights = buildMockFlights(direction, airport, date);
    if (args.flightId) {
      const id = args.flightId.trim().toUpperCase().replace(/\s+/g, "");
      flights = flights.filter((f) => f.flightId.replace(/\s+/g, "") === id);
    }
    return {
      ok: true,
      meta: {
        lastModified: new Date().toISOString(),
        lastModifiedInMinutes: "0",
        continuationToken: null,
        mock: true,
      },
      flights: flights.slice(0, count),
    };
  }

  try {
    const qs = new URLSearchParams({ filter, count: String(count) });
    if (args.continuationToken) qs.set("continuationToken", args.continuationToken);
    const res = await callSwedavia(`/query?${qs.toString()}`, apiKey);
    if (!res.ok) return mapHttpError(res.status);
    const json = await res.json();
    return {
      ok: true,
      meta: {
        lastModified: res.headers.get("Last-Modified"),
        lastModifiedInMinutes: res.headers.get("Last-Modified-InMinutes"),
        continuationToken: res.headers.get("x-continuation-token"),
        mock: false,
      },
      flights: validateFlights(json, direction),
    };
  } catch (err) {
    if ((err as Error)?.name === "AbortError")
      return fail("timeout", "Förfrågan tog för lång tid (timeout).", null);
    return fail("upstream", "Kunde inte nå Swedavia.", null);
  }
}

export async function runHeartbeat(): Promise<HeartbeatResponse> {
  const apiKey = getApiKey();
  if (!apiKey)
    return {
      ok: true,
      status: "online",
      message: "Mockläge – ingen API-nyckel konfigurerad.",
      mock: true,
    };
  try {
    const res = await callSwedavia("/heartBeat", apiKey);
    if (res.status === 404)
      return {
        ok: true,
        status: "unsupported",
        message: "HeartBeat stöds inte av denna prenumeration (404).",
        mock: false,
      };
    if (!res.ok) return mapHttpError(res.status);
    return { ok: true, status: "online", message: "API svarar normalt.", mock: false };
  } catch (err) {
    if ((err as Error)?.name === "AbortError")
      return fail("timeout", "HeartBeat tog för lång tid (timeout).", null);
    return fail("upstream", "Kunde inte nå Swedavia.", null);
  }
}

export const AIRPORT_NAMES = AIRPORTS;
