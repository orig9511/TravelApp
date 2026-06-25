import * as dotenv from "dotenv";
dotenv.config();

import { DataSource } from "typeorm";
import { Flight } from "../src/flights/entities/flight.entity";

// ─── Seeded deterministic RNG (reproducible dataset on every run) ─────────────
class RNG {
  private s: number;
  constructor(seed = 20260101) {
    this.s = seed;
  }
  next(): number {
    this.s = (Math.imul(1664525, this.s) + 1013904223) | 0;
    return (this.s >>> 0) / 4294967295;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  bool(p = 0.5): boolean {
    return this.next() < p;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

const rng = new RNG(20260101);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Airport catalogue ────────────────────────────────────────────────────────
const AIRPORTS: Record<string, string> = {
  BUD: "Budapest",
  VIE: "Vienna",
  FRA: "Frankfurt",
  AMS: "Amsterdam",
  CDG: "Paris",
  LHR: "London",
  IST: "Istanbul",
  DXB: "Dubai",
  JFK: "New York",
  BCN: "Barcelona",
  MAD: "Madrid",
  LIS: "Lisbon",
  FCO: "Rome",
  WAW: "Warsaw",
  PRG: "Prague",
  ZRH: "Zurich",
  MUC: "Munich",
  ATH: "Athens",
  DUB: "Dublin",
  CPH: "Copenhagen",
};

// ─── Future departure dates (spread across Jun–Sep 2026) ─────────────────────
const FUTURE_DATES = [
  "2026-06-05",
  "2026-06-12",
  "2026-06-19",
  "2026-06-26",
  "2026-07-03",
  "2026-07-10",
  "2026-07-17",
  "2026-07-24",
  "2026-08-07",
  "2026-08-14",
  "2026-08-21",
  "2026-09-04",
  "2026-09-11",
  "2026-09-18",
];

// ─── Route templates ──────────────────────────────────────────────────────────
interface RouteTemplate {
  from: string;
  to: string;
  durationRange: [number, number];
  priceRange: [number, number];
  airlines: string[];
  stopsRange: [number, number];
  timeSlots: string[];
}

const ROUTES: RouteTemplate[] = [
  // ── Short-haul European (< 2 h) ─────────────────────────────────────────
  {
    from: "BUD",
    to: "VIE",
    durationRange: [45, 60],
    priceRange: [39, 85],
    airlines: ["Austrian Airlines", "Ryanair", "Wizz Air"],
    stopsRange: [0, 0],
    timeSlots: ["06:30", "09:15", "13:45", "17:20", "21:00"],
  },
  {
    from: "VIE",
    to: "BUD",
    durationRange: [45, 60],
    priceRange: [39, 85],
    airlines: ["Austrian Airlines", "Ryanair"],
    stopsRange: [0, 0],
    timeSlots: ["07:00", "11:30", "15:10", "19:45"],
  },
  {
    from: "BUD",
    to: "PRG",
    durationRange: [75, 90],
    priceRange: [49, 98],
    airlines: ["Wizz Air", "Ryanair"],
    stopsRange: [0, 0],
    timeSlots: ["08:00", "12:30", "16:20", "20:10"],
  },
  {
    from: "PRG",
    to: "BUD",
    durationRange: [75, 90],
    priceRange: [49, 98],
    airlines: ["Wizz Air", "Ryanair"],
    stopsRange: [0, 0],
    timeSlots: ["07:15", "14:00", "18:30"],
  },
  {
    from: "BUD",
    to: "WAW",
    durationRange: [85, 100],
    priceRange: [55, 108],
    airlines: ["LOT Polish Airlines", "Wizz Air"],
    stopsRange: [0, 0],
    timeSlots: ["07:40", "13:15", "17:55"],
  },
  {
    from: "WAW",
    to: "BUD",
    durationRange: [85, 100],
    priceRange: [55, 108],
    airlines: ["LOT Polish Airlines", "Wizz Air"],
    stopsRange: [0, 0],
    timeSlots: ["09:10", "14:30", "19:20"],
  },
  {
    from: "BUD",
    to: "MUC",
    durationRange: [90, 110],
    priceRange: [58, 118],
    airlines: ["Lufthansa", "Ryanair"],
    stopsRange: [0, 0],
    timeSlots: ["06:55", "10:30", "14:15", "18:40"],
  },
  {
    from: "MUC",
    to: "BUD",
    durationRange: [90, 110],
    priceRange: [58, 118],
    airlines: ["Lufthansa", "Austrian Airlines"],
    stopsRange: [0, 0],
    timeSlots: ["08:00", "12:20", "16:45", "20:10"],
  },
  {
    from: "BUD",
    to: "FRA",
    durationRange: [100, 115],
    priceRange: [65, 132],
    airlines: ["Lufthansa", "Ryanair", "Wizz Air"],
    stopsRange: [0, 0],
    timeSlots: ["06:10", "09:45", "13:30", "17:50", "21:20"],
  },
  {
    from: "FRA",
    to: "BUD",
    durationRange: [100, 115],
    priceRange: [65, 132],
    airlines: ["Lufthansa", "Ryanair"],
    stopsRange: [0, 0],
    timeSlots: ["07:30", "11:00", "15:20", "19:05"],
  },
  {
    from: "VIE",
    to: "FRA",
    durationRange: [85, 100],
    priceRange: [50, 102],
    airlines: ["Lufthansa", "Austrian Airlines"],
    stopsRange: [0, 0],
    timeSlots: ["07:30", "12:10", "17:00", "20:50"],
  },
  {
    from: "FRA",
    to: "VIE",
    durationRange: [85, 100],
    priceRange: [50, 102],
    airlines: ["Lufthansa", "Austrian Airlines"],
    stopsRange: [0, 0],
    timeSlots: ["08:15", "13:30", "18:15"],
  },
  {
    from: "FRA",
    to: "AMS",
    durationRange: [65, 80],
    priceRange: [45, 92],
    airlines: ["Lufthansa", "KLM"],
    stopsRange: [0, 0],
    timeSlots: ["07:00", "10:30", "14:45", "19:20"],
  },
  {
    from: "AMS",
    to: "FRA",
    durationRange: [65, 80],
    priceRange: [45, 92],
    airlines: ["KLM", "Lufthansa"],
    stopsRange: [0, 0],
    timeSlots: ["08:00", "12:00", "16:30", "20:00"],
  },
  {
    from: "AMS",
    to: "LHR",
    durationRange: [50, 65],
    priceRange: [55, 112],
    airlines: ["KLM", "British Airways"],
    stopsRange: [0, 0],
    timeSlots: ["07:15", "10:00", "14:30", "18:45", "22:00"],
  },
  {
    from: "LHR",
    to: "AMS",
    durationRange: [50, 65],
    priceRange: [55, 112],
    airlines: ["British Airways", "KLM"],
    stopsRange: [0, 0],
    timeSlots: ["06:30", "09:45", "13:15", "17:30", "21:00"],
  },
  {
    from: "CDG",
    to: "LHR",
    durationRange: [70, 85],
    priceRange: [65, 128],
    airlines: ["Air France", "British Airways"],
    stopsRange: [0, 0],
    timeSlots: ["08:00", "11:30", "15:00", "19:45"],
  },
  {
    from: "LHR",
    to: "CDG",
    durationRange: [70, 85],
    priceRange: [65, 128],
    airlines: ["British Airways", "Air France"],
    stopsRange: [0, 0],
    timeSlots: ["07:30", "10:45", "14:00", "18:30"],
  },
  {
    from: "BUD",
    to: "FCO",
    durationRange: [120, 140],
    priceRange: [75, 158],
    airlines: ["ITA Airways", "Ryanair", "Wizz Air"],
    stopsRange: [0, 0],
    timeSlots: ["07:00", "11:15", "15:40", "19:20"],
  },
  {
    from: "FCO",
    to: "BUD",
    durationRange: [120, 140],
    priceRange: [75, 158],
    airlines: ["ITA Airways", "Ryanair"],
    stopsRange: [0, 0],
    timeSlots: ["08:30", "12:45", "16:10", "20:30"],
  },
  {
    from: "BUD",
    to: "ZRH",
    durationRange: [100, 120],
    priceRange: [70, 135],
    airlines: ["Swiss International Air Lines", "Ryanair"],
    stopsRange: [0, 0],
    timeSlots: ["07:15", "11:40", "16:00", "20:20"],
  },
  {
    from: "ZRH",
    to: "BUD",
    durationRange: [100, 120],
    priceRange: [70, 135],
    airlines: ["Swiss International Air Lines", "Wizz Air"],
    stopsRange: [0, 0],
    timeSlots: ["09:00", "13:20", "17:45"],
  },
  {
    from: "BUD",
    to: "CPH",
    durationRange: [130, 150],
    priceRange: [82, 165],
    airlines: ["SAS", "Ryanair"],
    stopsRange: [0, 0],
    timeSlots: ["08:30", "13:00", "18:15"],
  },
  {
    from: "BUD",
    to: "DUB",
    durationRange: [175, 195],
    priceRange: [95, 185],
    airlines: ["Ryanair", "Aer Lingus"],
    stopsRange: [0, 0],
    timeSlots: ["07:00", "13:30", "18:00"],
  },
  // ── Medium-haul European (2–4 h) ─────────────────────────────────────────
  {
    from: "BUD",
    to: "AMS",
    durationRange: [135, 155],
    priceRange: [85, 178],
    airlines: ["KLM", "Wizz Air"],
    stopsRange: [0, 1],
    timeSlots: ["06:40", "09:50", "13:20", "18:00"],
  },
  {
    from: "AMS",
    to: "BUD",
    durationRange: [135, 155],
    priceRange: [85, 178],
    airlines: ["KLM", "Wizz Air"],
    stopsRange: [0, 1],
    timeSlots: ["08:30", "12:15", "15:50", "20:30"],
  },
  {
    from: "BUD",
    to: "CDG",
    durationRange: [145, 165],
    priceRange: [90, 188],
    airlines: ["Air France", "Wizz Air"],
    stopsRange: [0, 1],
    timeSlots: ["07:20", "11:05", "14:50", "19:30"],
  },
  {
    from: "CDG",
    to: "BUD",
    durationRange: [145, 165],
    priceRange: [90, 188],
    airlines: ["Air France", "Wizz Air"],
    stopsRange: [0, 1],
    timeSlots: ["09:00", "13:30", "17:15", "21:10"],
  },
  {
    from: "BUD",
    to: "LHR",
    durationRange: [145, 165],
    priceRange: [95, 198],
    airlines: ["British Airways", "Wizz Air"],
    stopsRange: [0, 1],
    timeSlots: ["06:50", "10:20", "14:10", "18:40"],
  },
  {
    from: "LHR",
    to: "BUD",
    durationRange: [145, 165],
    priceRange: [95, 198],
    airlines: ["British Airways", "Ryanair"],
    stopsRange: [0, 1],
    timeSlots: ["09:30", "13:45", "17:00", "21:15"],
  },
  {
    from: "BUD",
    to: "BCN",
    durationRange: [155, 175],
    priceRange: [100, 195],
    airlines: ["Ryanair", "Vueling"],
    stopsRange: [0, 1],
    timeSlots: ["07:30", "12:00", "16:30", "20:00"],
  },
  {
    from: "BCN",
    to: "BUD",
    durationRange: [155, 175],
    priceRange: [100, 195],
    airlines: ["Ryanair", "Vueling"],
    stopsRange: [0, 1],
    timeSlots: ["09:00", "14:15", "18:30"],
  },
  {
    from: "BUD",
    to: "MAD",
    durationRange: [175, 200],
    priceRange: [110, 218],
    airlines: ["Iberia", "Wizz Air"],
    stopsRange: [0, 1],
    timeSlots: ["07:00", "11:30", "16:00", "20:30"],
  },
  {
    from: "MAD",
    to: "BUD",
    durationRange: [175, 200],
    priceRange: [110, 218],
    airlines: ["Iberia", "Ryanair"],
    stopsRange: [0, 1],
    timeSlots: ["09:30", "14:00", "18:30"],
  },
  {
    from: "BUD",
    to: "LIS",
    durationRange: [175, 200],
    priceRange: [110, 218],
    airlines: ["TAP Air Portugal", "Ryanair"],
    stopsRange: [0, 1],
    timeSlots: ["08:15", "13:00", "17:45"],
  },
  {
    from: "LIS",
    to: "BUD",
    durationRange: [175, 200],
    priceRange: [110, 218],
    airlines: ["TAP Air Portugal", "Ryanair"],
    stopsRange: [0, 1],
    timeSlots: ["09:00", "14:30", "19:00"],
  },
  {
    from: "BUD",
    to: "ATH",
    durationRange: [110, 130],
    priceRange: [70, 148],
    airlines: ["Aegean Airlines", "Ryanair"],
    stopsRange: [0, 0],
    timeSlots: ["07:30", "12:00", "17:15", "21:00"],
  },
  {
    from: "ATH",
    to: "BUD",
    durationRange: [110, 130],
    priceRange: [70, 148],
    airlines: ["Aegean Airlines", "Ryanair"],
    stopsRange: [0, 0],
    timeSlots: ["09:00", "13:30", "18:00"],
  },
  {
    from: "BUD",
    to: "IST",
    durationRange: [110, 130],
    priceRange: [75, 158],
    airlines: ["Turkish Airlines", "Pegasus"],
    stopsRange: [0, 0],
    timeSlots: ["08:00", "13:00", "18:30"],
  },
  {
    from: "IST",
    to: "BUD",
    durationRange: [110, 130],
    priceRange: [75, 158],
    airlines: ["Turkish Airlines", "Pegasus"],
    stopsRange: [0, 0],
    timeSlots: ["07:30", "12:20", "17:00", "21:45"],
  },
  {
    from: "VIE",
    to: "LHR",
    durationRange: [120, 140],
    priceRange: [80, 162],
    airlines: ["British Airways", "Austrian Airlines"],
    stopsRange: [0, 0],
    timeSlots: ["07:00", "11:30", "15:45", "20:00"],
  },
  {
    from: "VIE",
    to: "CDG",
    durationRange: [140, 160],
    priceRange: [80, 168],
    airlines: ["Air France", "Austrian Airlines"],
    stopsRange: [0, 0],
    timeSlots: ["08:30", "13:15", "17:45"],
  },
  {
    from: "LHR",
    to: "IST",
    durationRange: [205, 225],
    priceRange: [115, 235],
    airlines: ["Turkish Airlines", "British Airways"],
    stopsRange: [0, 0],
    timeSlots: ["07:00", "11:00", "15:30", "19:45"],
  },
  {
    from: "IST",
    to: "LHR",
    durationRange: [205, 225],
    priceRange: [115, 235],
    airlines: ["Turkish Airlines", "British Airways"],
    stopsRange: [0, 0],
    timeSlots: ["09:30", "14:15", "18:00"],
  },
  {
    from: "FRA",
    to: "BCN",
    durationRange: [125, 140],
    priceRange: [70, 148],
    airlines: ["Lufthansa", "Vueling"],
    stopsRange: [0, 0],
    timeSlots: ["08:00", "12:30", "17:00", "20:30"],
  },
  {
    from: "BCN",
    to: "FRA",
    durationRange: [125, 140],
    priceRange: [70, 148],
    airlines: ["Vueling", "Ryanair"],
    stopsRange: [0, 0],
    timeSlots: ["09:30", "14:00", "18:30"],
  },
  {
    from: "CDG",
    to: "MAD",
    durationRange: [115, 130],
    priceRange: [65, 142],
    airlines: ["Air France", "Iberia"],
    stopsRange: [0, 0],
    timeSlots: ["07:30", "12:00", "16:30", "20:00"],
  },
  {
    from: "MAD",
    to: "CDG",
    durationRange: [115, 130],
    priceRange: [65, 142],
    airlines: ["Iberia", "Air France"],
    stopsRange: [0, 0],
    timeSlots: ["09:00", "13:30", "17:00"],
  },
  {
    from: "FRA",
    to: "LHR",
    durationRange: [95, 110],
    priceRange: [60, 122],
    airlines: ["Lufthansa", "British Airways"],
    stopsRange: [0, 0],
    timeSlots: ["06:45", "09:30", "13:00", "17:30", "21:00"],
  },
  {
    from: "LHR",
    to: "FRA",
    durationRange: [95, 110],
    priceRange: [60, 122],
    airlines: ["British Airways", "Lufthansa"],
    stopsRange: [0, 0],
    timeSlots: ["07:15", "11:00", "14:45", "19:00"],
  },
  // ── Long-haul intercontinental (4 h+) ─────────────────────────────────────
  {
    from: "BUD",
    to: "DXB",
    durationRange: [345, 375],
    priceRange: [278, 625],
    airlines: ["Emirates", "Turkish Airlines", "Qatar Airways"],
    stopsRange: [0, 1],
    timeSlots: ["02:30", "09:00", "21:45"],
  },
  {
    from: "DXB",
    to: "BUD",
    durationRange: [345, 375],
    priceRange: [278, 625],
    airlines: ["Emirates", "Turkish Airlines"],
    stopsRange: [0, 1],
    timeSlots: ["08:30", "16:15", "23:00"],
  },
  {
    from: "BUD",
    to: "JFK",
    durationRange: [550, 590],
    priceRange: [418, 955],
    airlines: ["Lufthansa", "Turkish Airlines"],
    stopsRange: [1, 1],
    timeSlots: ["06:20", "14:00"],
  },
  {
    from: "JFK",
    to: "BUD",
    durationRange: [550, 590],
    priceRange: [418, 955],
    airlines: ["Lufthansa", "Turkish Airlines"],
    stopsRange: [1, 1],
    timeSlots: ["08:30", "18:00"],
  },
  {
    from: "LHR",
    to: "DXB",
    durationRange: [375, 400],
    priceRange: [232, 565],
    airlines: ["Emirates", "British Airways", "Qatar Airways"],
    stopsRange: [0, 0],
    timeSlots: ["09:00", "14:30", "22:00"],
  },
  {
    from: "DXB",
    to: "LHR",
    durationRange: [375, 400],
    priceRange: [232, 565],
    airlines: ["Emirates", "British Airways"],
    stopsRange: [0, 0],
    timeSlots: ["02:30", "08:00", "14:00"],
  },
  {
    from: "LHR",
    to: "JFK",
    durationRange: [405, 430],
    priceRange: [328, 725],
    airlines: ["British Airways", "Virgin Atlantic"],
    stopsRange: [0, 0],
    timeSlots: ["10:00", "14:00", "18:00", "22:00"],
  },
  {
    from: "JFK",
    to: "LHR",
    durationRange: [405, 430],
    priceRange: [328, 725],
    airlines: ["British Airways", "Virgin Atlantic"],
    stopsRange: [0, 0],
    timeSlots: ["19:00", "22:00", "23:55"],
  },
  {
    from: "FRA",
    to: "JFK",
    durationRange: [495, 520],
    priceRange: [378, 825],
    airlines: ["Lufthansa", "United Airlines"],
    stopsRange: [0, 0],
    timeSlots: ["10:30", "14:00", "17:30"],
  },
  {
    from: "JFK",
    to: "FRA",
    durationRange: [495, 520],
    priceRange: [378, 825],
    airlines: ["Lufthansa", "United Airlines"],
    stopsRange: [0, 0],
    timeSlots: ["17:00", "20:30", "23:00"],
  },
  {
    from: "CDG",
    to: "DXB",
    durationRange: [360, 390],
    priceRange: [258, 575],
    airlines: ["Air France", "Emirates", "Qatar Airways"],
    stopsRange: [0, 0],
    timeSlots: ["08:30", "14:00", "21:30"],
  },
  {
    from: "DXB",
    to: "CDG",
    durationRange: [360, 390],
    priceRange: [258, 575],
    airlines: ["Air France", "Emirates"],
    stopsRange: [0, 0],
    timeSlots: ["07:00", "13:00", "19:30"],
  },
  {
    from: "IST",
    to: "DXB",
    durationRange: [215, 235],
    priceRange: [138, 315],
    airlines: ["Turkish Airlines", "Flydubai"],
    stopsRange: [0, 0],
    timeSlots: ["07:00", "11:30", "15:00", "20:45"],
  },
  {
    from: "DXB",
    to: "IST",
    durationRange: [215, 235],
    priceRange: [138, 315],
    airlines: ["Turkish Airlines", "Flydubai"],
    stopsRange: [0, 0],
    timeSlots: ["09:00", "13:00", "17:30", "22:00"],
  },
];

// ─── Flight record generator ──────────────────────────────────────────────────
interface FlightRecord {
  airline: string;
  fromCode: string;
  toCode: string;
  fromLabel: string;
  toLabel: string;
  departAt: string;
  departDate: Date;
  arriveAt: string;
  price: number;
  currency: string;
  stopsCount: number;
  durationMinutes: number;
  isRefundable: boolean;
  hasBaggage: boolean;
  availableSeats: number;
}

// Logical deduplication key used to detect already-inserted records
function dedupKey(r: FlightRecord): string {
  return [
    r.airline,
    r.fromCode,
    r.toCode,
    r.departDate.toISOString().slice(0, 10),
    r.departAt,
  ].join("|");
}

function generateFlights(targetMax = 300): FlightRecord[] {
  const flights: FlightRecord[] = [];

  for (const route of ROUTES) {
    if (flights.length >= targetMax) break;

    // Each route uses 3 pseudo-randomly selected dates
    const routeDates = rng.shuffle([...FUTURE_DATES]).slice(0, 3);
    // Limit airlines to 2 to keep per-route count bounded
    const routeAirlines = route.airlines.slice(0, 2);

    for (const dateStr of routeDates) {
      for (const airline of routeAirlines) {
        if (flights.length >= targetMax) break;

        const departAt = rng.pick(route.timeSlots);
        const duration = rng.int(
          route.durationRange[0],
          route.durationRange[1],
        );
        const arriveAt = addMinutes(departAt, duration);

        // Slight price variation ±8 % around a random point in the range
        const basePrice = rng.int(route.priceRange[0], route.priceRange[1]);
        const jitter = 1 + (rng.next() * 0.16 - 0.08);
        const price = round2(
          Math.max(
            route.priceRange[0],
            Math.min(route.priceRange[1], basePrice * jitter),
          ),
        );

        const stopsCount =
          route.stopsRange[0] === route.stopsRange[1]
            ? route.stopsRange[0]
            : rng.bool(0.65)
              ? route.stopsRange[0]
              : route.stopsRange[1];

        flights.push({
          airline,
          fromCode: route.from,
          toCode: route.to,
          fromLabel: AIRPORTS[route.from],
          toLabel: AIRPORTS[route.to],
          departAt,
          departDate: new Date(`${dateStr}T00:00:00.000Z`),
          arriveAt,
          price,
          currency: "EUR",
          stopsCount,
          durationMinutes: duration,
          isRefundable: rng.bool(0.38),
          hasBaggage: rng.bool(0.52),
          availableSeats: rng.int(4, 155),
        });
      }
    }
  }

  return flights;
}

// ─── DataSource ───────────────────────────────────────────────────────────────
function buildDataSource(): DataSource {
  return new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    synchronize: false,
    logging: false,
    entities: [Flight],
    connectTimeoutMS: 15000,
    extra: {
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 30000,
    },
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const banner = "═".repeat(55);
  console.log(`\n╔${banner}╗`);
  console.log(`║   Flight Demo Seed  —  Supabase PostgreSQL           ║`);
  console.log(`╚${banner}╝\n`);

  if (!process.env.DATABASE_URL) {
    console.error("[fatal] DATABASE_URL is not set. Check your .env file.");
    process.exit(1);
  }

  // ── Step 1: generate candidate flights ──────────────────────────────────
  console.log("[gen]   Generating candidate flight records...");
  const candidates = generateFlights(300);
  console.log(`[gen]   Generated ${candidates.length} candidate records`);

  // ── Step 2: connect ──────────────────────────────────────────────────────
  console.log("[db]    Connecting to Supabase...");
  const ds = buildDataSource();
  await ds.initialize();
  console.log("[db]    Connected. SSL active.");

  const repo = ds.getRepository(Flight);

  try {
    // ── Step 3: load existing dedup keys ────────────────────────────────
    console.log("[db]    Loading existing flights for deduplication...");
    const existing = await repo.find({
      select: ["airline", "fromCode", "toCode", "departDate", "departAt"],
    });
    const existingKeys = new Set(
      existing.map((f) => {
        const dateStr =
          f.departDate instanceof Date
            ? f.departDate.toISOString().slice(0, 10)
            : String(f.departDate).slice(0, 10);
        return [f.airline, f.fromCode, f.toCode, dateStr, f.departAt].join("|");
      }),
    );
    console.log(`[db]    ${existing.length} existing flight(s) found.`);

    // ── Step 4: filter duplicates ────────────────────────────────────────
    const toInsert = candidates.filter((c) => !existingKeys.has(dedupKey(c)));
    const duplicatesSkipped = candidates.length - toInsert.length;
    console.log(`[dedup] ${duplicatesSkipped} duplicate(s) skipped`);
    console.log(`[dedup] ${toInsert.length} new record(s) to insert`);

    if (toInsert.length === 0) {
      console.log("\n[info]  Nothing to insert — all records already present.");
      return;
    }

    // ── Step 5: batch insert (50 per chunk) ─────────────────────────────
    console.log("[seed]  Inserting flights in batches of 50...");
    const CHUNK = 50;
    let inserted = 0;

    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const chunk = toInsert.slice(i, i + CHUNK);
      const entities = chunk.map((d) => repo.create(d));
      await repo.save(entities, { chunk: CHUNK });
      inserted += chunk.length;
      console.log(
        `[seed]  batch ${Math.ceil(i / CHUNK) + 1}: inserted ${chunk.length} (total so far: ${inserted})`,
      );
    }

    // ── Step 6: final count ──────────────────────────────────────────────
    const totalInDb = await repo.count();

    console.log(`\n${"─".repeat(57)}`);
    console.log("  FLIGHT SEED COMPLETE");
    console.log(`${"─".repeat(57)}`);
    console.log(`  Flight structure   : TypeORM entity  →  flights  table`);
    console.log(`  Target table       : flights`);
    console.log(`  Candidates built   : ${candidates.length}`);
    console.log(
      `  Duplicates skipped : ${duplicatesSkipped}  (existing records protected)`,
    );
    console.log(`  New records inserted: ${inserted}`);
    console.log(`  Total rows in DB   : ${totalInDb}`);
    console.log(`  Data safety        : INSERT-only — no DROP/TRUNCATE/DELETE`);
    console.log(`  Idempotency        : dedup key = airline|from|to|date|time`);
    console.log(`${"─".repeat(57)}\n`);
  } finally {
    await ds.destroy();
  }
}

main().catch((err) => {
  console.error("\n[fatal]", err);
  process.exit(1);
});
