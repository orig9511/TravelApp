import {
  extractDocId,
  FirestoreDoc,
  normalizeBoolean,
  normalizeNull,
  normalizeNumber,
  normalizeString,
  toISOString,
} from "./shared.utils";

export interface FirestoreFlight extends FirestoreDoc {
  airline?: unknown;
  fromCode?: unknown;
  toCode?: unknown;
  fromLabel?: unknown;
  toLabel?: unknown;
  departAt?: unknown;
  departDate?: unknown;
  arriveAt?: unknown;
  price?: unknown;
  currency?: unknown;
  stopsCount?: unknown;
  durationMinutes?: unknown;
  isRefundable?: unknown;
  hasBaggage?: unknown;
  availableSeats?: unknown;
  createdAt?: unknown;
}

export interface PostgresFlight {
  id: string;
  airline: string;
  fromCode: string;
  toCode: string;
  fromLabel: string;
  toLabel: string;
  departAt: string;
  departDate: string | null;
  arriveAt: string;
  price: number;
  currency: string;
  stopsCount: number;
  durationMinutes: number;
  isRefundable: boolean;
  hasBaggage: boolean;
  availableSeats: number;
  createdAt: string | null;
}

export function mapFlight(doc: FirestoreFlight): PostgresFlight {
  const fromCode = normalizeString(doc.fromCode);
  const toCode = normalizeString(doc.toCode);

  return {
    id: extractDocId(doc),
    airline: normalizeString(doc.airline),
    fromCode,
    toCode,
    fromLabel: normalizeString(doc.fromLabel, fromCode),
    toLabel: normalizeString(doc.toLabel, toCode),
    departAt: normalizeString(doc.departAt),
    departDate: normalizeNull(toISOString(doc.departDate)),
    arriveAt: normalizeString(doc.arriveAt),
    price: normalizeNumber(doc.price),
    currency: normalizeString(doc.currency, "EUR"),
    stopsCount: normalizeNumber(doc.stopsCount),
    durationMinutes: normalizeNumber(doc.durationMinutes),
    isRefundable: normalizeBoolean(doc.isRefundable),
    hasBaggage: normalizeBoolean(doc.hasBaggage),
    availableSeats: normalizeNumber(doc.availableSeats),
    createdAt: normalizeNull(toISOString(doc.createdAt)),
  };
}

export function mapFlights(docs: FirestoreFlight[]): PostgresFlight[] {
  return docs.map(mapFlight);
}
