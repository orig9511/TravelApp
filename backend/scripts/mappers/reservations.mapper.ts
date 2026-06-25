import {
  extractDocId,
  extractFirestoreId,
  FirestoreDoc,
  normalizeNull,
  normalizeNumber,
  toISOString,
} from "./shared.utils";

export interface FirestoreReservation extends FirestoreDoc {
  /** Firestore ref or "accommodations/id" */
  accommodationRef?: unknown;
  accommodationId?: unknown;
  /** Firestore ref or "users/userId" */
  userRef?: unknown;
  userId?: unknown;
  /** Firestore ref or "flights/flightId" (optional) */
  flightRef?: unknown;
  flightId?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  price?: unknown;
  persons?: unknown;
  createdAt?: unknown;
}

export interface PostgresReservation {
  id: string;
  accommodationId: string | null;
  userId: string | null;
  flightId: string | null;
  startDate: string | null;
  endDate: string | null;
  price: number;
  persons: number;
  createdAt: string | null;
}

export function mapReservation(doc: FirestoreReservation): PostgresReservation {
  return {
    id: extractDocId(doc),
    accommodationId: normalizeNull(
      extractFirestoreId(doc.accommodationRef ?? doc.accommodationId),
    ),
    userId: normalizeNull(extractFirestoreId(doc.userRef ?? doc.userId)),
    flightId: normalizeNull(extractFirestoreId(doc.flightRef ?? doc.flightId)),
    startDate: normalizeNull(toISOString(doc.startDate)),
    endDate: normalizeNull(toISOString(doc.endDate)),
    price: normalizeNumber(doc.price),
    persons: normalizeNumber(doc.persons, 1),
    createdAt: normalizeNull(toISOString(doc.createdAt)),
  };
}

export function mapReservations(
  docs: FirestoreReservation[],
): PostgresReservation[] {
  return docs.map(mapReservation);
}
