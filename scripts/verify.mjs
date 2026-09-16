import assert from "node:assert/strict";
import { register } from "node:module";

register("./ts-loader.mjs", import.meta.url);

const time = await import("../src/lib/time.ts");
const airports = await import("../src/lib/airports.ts");
const preview = await import("../src/lib/odata-preview.ts");
const status = await import("../src/lib/status.ts");
const api = await import("../src/lib/swedavia.server.ts");

assert.equal(time.isValidApiDate("2026-02-30"), false);
assert.equal(time.toODataDate("2026-09-16"), "260916");
assert.equal(airports.resolveAirport("göteborg"), "GOT");
assert.equal(status.statusTone("CAN", "Cancelled"), "red");
assert.equal(
  preview.previewFilter({ airport: "ARN", flightType: "A", scheduled: "2026-09-16" }),
  "(airport eq 'ARN' and flightType eq 'A' and scheduled eq '260916')",
);

const today = time.toApiDate(new Date());
const odataToday = time.toODataDate(today);
assert.equal(
  api.buildFilter({ airport: "ARN", flightType: "D", scheduled: today }),
  `(airport eq 'ARN' and flightType eq 'D' and scheduled eq '${odataToday}')`,
);
assert.equal(api.buildFilter({ flightId: "not a flight" }), null);
assert.equal(api.clampCount(0), 1);
assert.equal(api.clampCount(5000), 1000);

const normalized = api.normalizeFlight(
  {
    FlightId: "SK1425",
    DepartureAirportSwedish: "Köpenhamn",
    AirlineOperator: { IATA: "SK", Name: "SAS" },
    ArrivalTime: {
      ScheduledUtc: "2026-09-16T10:00:00Z",
      EstimatedUtc: "2026-09-16T10:05:00Z",
    },
    LocationAndStatus: {
      Terminal: "5",
      Gate: "F32",
      FlightLegStatus: "LAN",
      FlightLegStatusSwedish: "Landat",
    },
    Baggage: { BaggageClaimUnit: "7" },
    FlightLegIdentifier: { DepartureAirportIata: "CPH", ArrivalAirportIata: "ARN" },
    ViaDestinations: [{ AirportSwedish: "Visby" }],
    RemarksSwedish: [{ Text: "Bagage på band" }],
    DIIndicator: "S",
  },
  "arrivals",
);

assert.equal(normalized.airlineName, "SAS");
assert.equal(normalized.fromIata, "CPH");
assert.equal(normalized.toIata, "ARN");
assert.equal(normalized.baggageBelt, "7");
assert.deepEqual(normalized.via, ["Visby"]);
assert.deepEqual(normalized.remarks, ["Bagage på band"]);
assert.equal(normalized.locationType, "Schengen");

console.log("Core verification passed (date, OData, airport, status, and API normalization).");
