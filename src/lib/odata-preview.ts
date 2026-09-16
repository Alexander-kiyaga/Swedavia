import type { QueryArgs } from "./flight-types";
import { toODataDate } from "./time";

export const FLIGHT_ID_PATTERN = /^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/;

export function normalizeFlightNumber(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, " ");
}

/** Client-side mirror of the server filter builder, for a read-only preview. */
export function previewFilter(args: QueryArgs): string {
  const parts: string[] = [];
  if (args.airport) parts.push(`airport eq '${args.airport}'`);
  if (args.flightType) parts.push(`flightType eq '${args.flightType}'`);
  if (args.scheduled) {
    const scheduled = toODataDate(args.scheduled);
    parts.push(`scheduled eq '${scheduled ?? "ogiltigt datum"}'`);
  }
  if (args.flightId) {
    const id = normalizeFlightNumber(args.flightId);
    parts.push(`flightId eq '${id.replace(/'/g, "''")}'`);
  }
  if (!parts.length) return "";
  return parts.length === 1 ? parts[0]! : `(${parts.join(" and ")})`;
}
