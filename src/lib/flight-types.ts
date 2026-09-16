import type { AirportCode } from "./airports";

export type FlightDirection = "arrivals" | "departures";

export interface FlightTime {
  utc: string | null;
}

export interface NormalizedFlight {
  flightId: string;
  airlineName: string | null;
  airlineIata: string | null;
  from: string | null;
  fromIata: string | null;
  to: string | null;
  toIata: string | null;
  otherCity: string | null;
  statusCode: string | null;
  statusText: string | null;
  terminal: string | null;
  gate: string | null;
  baggageBelt: string | null;
  checkIn: string | null;
  scheduledUtc: string | null;
  estimatedUtc: string | null;
  actualUtc: string | null;
  locationType: string | null;
  via: string[];
  remarks: string[];
  direction: FlightDirection;
}

export interface FlightInfoMeta {
  lastModified: string | null;
  lastModifiedInMinutes: string | null;
  continuationToken: string | null;
  mock: boolean;
}

export interface FlightInfoSuccess {
  ok: true;
  meta: FlightInfoMeta;
  flights: NormalizedFlight[];
}

export interface HeartbeatResult {
  ok: true;
  status: "online" | "unsupported";
  message: string;
  mock: boolean;
}

export interface FlightInfoFailure {
  ok: false;
  kind: "auth" | "quota" | "notfound" | "timeout" | "upstream" | "input";
  message: string;
  status: number | null;
  mock: boolean;
}

export type FlightInfoResponse = FlightInfoSuccess | FlightInfoFailure;
export type HeartbeatResponse = HeartbeatResult | FlightInfoFailure;

export interface QueryArgs {
  airport?: AirportCode;
  flightType?: "A" | "D";
  scheduled?: string;
  flightId?: string;
  count?: number;
  continuationToken?: string;
}

/** Hide malformed ghost records. */
export function isValidFlight(f: NormalizedFlight): boolean {
  return Boolean(f.flightId && f.scheduledUtc && (f.from || f.to));
}

export function sortByScheduled(flights: NormalizedFlight[]): NormalizedFlight[] {
  return [...flights].sort((a, b) => (a.scheduledUtc ?? "").localeCompare(b.scheduledUtc ?? ""));
}
