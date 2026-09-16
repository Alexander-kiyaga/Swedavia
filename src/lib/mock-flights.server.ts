import { AIRPORTS, type AirportCode } from "./airports";
import type { FlightDirection, NormalizedFlight } from "./flight-types";

const ROUTES: Array<{ city: string; iata: string; airline: string; code: string }> = [
  { city: "Köpenhamn", iata: "CPH", airline: "SAS", code: "SK" },
  { city: "Oslo", iata: "OSL", airline: "Norwegian", code: "DY" },
  { city: "Helsingfors", iata: "HEL", airline: "Finnair", code: "AY" },
  { city: "London", iata: "LHR", airline: "British Airways", code: "BA" },
  { city: "Amsterdam", iata: "AMS", airline: "KLM", code: "KL" },
  { city: "Frankfurt", iata: "FRA", airline: "Lufthansa", code: "LH" },
  { city: "München", iata: "MUC", airline: "Lufthansa", code: "LH" },
  { city: "Paris", iata: "CDG", airline: "Air France", code: "AF" },
  { city: "Zürich", iata: "ZRH", airline: "Swiss", code: "LX" },
  { city: "Riga", iata: "RIX", airline: "airBaltic", code: "BT" },
  { city: "Warszawa", iata: "WAW", airline: "LOT", code: "LO" },
  { city: "Barcelona", iata: "BCN", airline: "Vueling", code: "VY" },
  { city: "Malaga", iata: "AGP", airline: "Norwegian", code: "DY" },
  { city: "Istanbul", iata: "IST", airline: "Turkish Airlines", code: "TK" },
  { city: "Dubai", iata: "DXB", airline: "Emirates", code: "EK" },
  { city: "Luleå", iata: "LLA", airline: "SAS", code: "SK" },
  { city: "Umeå", iata: "UME", airline: "SAS", code: "SK" },
  { city: "Göteborg", iata: "GOT", airline: "BRA", code: "TF" },
  { city: "Malmö", iata: "MMX", airline: "BRA", code: "TF" },
  { city: "Visby", iata: "VBY", airline: "BRA", code: "TF" },
];

const STATUSES: Array<{ code: string; text: string }> = [
  { code: "FPL", text: "Tidtabellsenlig" },
  { code: "SEQ", text: "Tidtabellsenlig" },
  { code: "ACT", text: "Aktiv" },
  { code: "LAN", text: "Landat" },
  { code: "DEP", text: "Avgått" },
  { code: "DEL", text: "Inställt" },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function buildMockFlights(
  direction: FlightDirection,
  airport: AirportCode,
  date: string,
): NormalizedFlight[] {
  const seed = hash(`${direction}|${airport}|${date}`);
  const total = 60 + (seed % 90);
  const local = AIRPORTS[airport];
  const flights: NormalizedFlight[] = [];

  for (let i = 0; i < total; i++) {
    const r = ROUTES[(seed + i * 7) % ROUTES.length]!;
    const st = STATUSES[(seed + i * 3) % STATUSES.length]!;
    const minutes = 5 * 60 + i * 11 + ((seed + i) % 9);
    const scheduled = new Date(`${date}T00:00:00Z`);
    scheduled.setUTCMinutes(scheduled.getUTCMinutes() + minutes);
    const estimated = new Date(scheduled.getTime() + ((seed + i) % 4) * 5 * 60_000);
    const landed = st.code === "LAN" || st.code === "DEP";
    const nr = 100 + ((seed + i * 13) % 899);

    flights.push({
      flightId: `${r.code}${nr}`,
      airlineName: r.airline,
      airlineIata: r.code,
      from: direction === "arrivals" ? r.city : local,
      fromIata: direction === "arrivals" ? r.iata : airport,
      to: direction === "arrivals" ? local : r.city,
      toIata: direction === "arrivals" ? airport : r.iata,
      otherCity: r.city,
      statusCode: st.code,
      statusText: st.text,
      terminal: String(2 + (i % 4)),
      gate: i % 7 === 0 ? null : `${String.fromCharCode(65 + (i % 6))}${10 + (i % 30)}`,
      baggageBelt: direction === "arrivals" ? String(1 + (i % 6)) : null,
      checkIn: direction === "departures" ? `Disk ${10 + (i % 20)}–${14 + (i % 20)}` : null,
      scheduledUtc: scheduled.toISOString(),
      estimatedUtc: st.code === "DEL" ? null : estimated.toISOString(),
      actualUtc: landed ? estimated.toISOString() : null,
      locationType:
        r.iata.length === 3 && ["LLA", "UME", "GOT", "MMX", "VBY"].includes(r.iata)
          ? "Inrikes"
          : ["IST", "DXB"].includes(r.iata)
            ? "Internationell"
            : "Schengen",
      via: i % 11 === 0 ? ["Köpenhamn"] : [],
      remarks: st.code === "DEL" ? ["Inställd av flygbolaget"] : [],
      direction,
    });
  }
  return flights;
}
