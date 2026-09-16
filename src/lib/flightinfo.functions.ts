import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { AIRPORT_CODES } from "./airports";
import type { FlightInfoResponse, HeartbeatResponse, QueryArgs } from "./flight-types";

const airportSchema = z.enum(AIRPORT_CODES as [string, ...string[]]);

const flightsSchema = z.object({
  action: z.enum(["arrivals", "departures"]),
  airport: airportSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const querySchema = z.object({
  action: z.literal("query"),
  airport: airportSchema.optional(),
  flightType: z.enum(["A", "D"]).optional(),
  scheduled: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  flightId: z.string().max(12).optional(),
  count: z.number().int().optional(),
  continuationToken: z.string().max(4096).optional(),
});

/** 60 second in-memory cache + in-flight deduplication. */
const cache = new Map<string, { at: number; value: FlightInfoResponse }>();
const inflight = new Map<string, Promise<FlightInfoResponse>>();
const TTL = 60_000;

async function cached(
  key: string,
  run: () => Promise<FlightInfoResponse>,
): Promise<FlightInfoResponse> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const pending = inflight.get(key);
  if (pending) return pending;
  const p = run()
    .then((value) => {
      if (value.ok) cache.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export const getFlights = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => flightsSchema.parse(data))
  .handler(async ({ data }): Promise<FlightInfoResponse> => {
    const { fetchFlights } = await import("./swedavia.server");
    return cached(`${data.action}|${data.airport}|${data.date}`, () =>
      fetchFlights(data.action, data.airport as never, data.date),
    );
  });

export const queryFlights = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => querySchema.parse(data))
  .handler(async ({ data }): Promise<FlightInfoResponse> => {
    const { runQuery } = await import("./swedavia.server");
    const args: QueryArgs = {};
    if (data.airport) args.airport = data.airport as QueryArgs["airport"];
    if (data.flightType) args.flightType = data.flightType;
    if (data.scheduled) args.scheduled = data.scheduled;
    if (data.flightId) args.flightId = data.flightId;
    if (data.count !== undefined) args.count = data.count;
    if (data.continuationToken) args.continuationToken = data.continuationToken;
    return runQuery(args);
  });

export const heartbeat = createServerFn({ method: "POST" }).handler(
  async (): Promise<HeartbeatResponse> => {
    const { runHeartbeat } = await import("./swedavia.server");
    return runHeartbeat();
  },
);
