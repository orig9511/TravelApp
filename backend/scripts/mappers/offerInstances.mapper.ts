import {
  deepCleanFirestore,
  extractDocId,
  extractFirestoreId,
  FirestoreDoc,
  normalizeNull,
  normalizeNumber,
  normalizeString,
  toISOString,
} from "./shared.utils";

export interface FirestoreOfferInstance extends FirestoreDoc {
  /** Firestore DocumentReference or "offers/offerId" */
  offerRef?: unknown;
  offerId?: unknown;
  departureDate?: unknown;
  returnDate?: unknown;
  pricePerPerson?: unknown;
  capacity?: unknown;
  availableCapacity?: unknown;
  title?: unknown;
  image?: unknown;
  travelCategory?: unknown;
  flightDetails?: unknown;
  extrasCapacity?: unknown;
  extrasAvailable?: unknown;
  createdAt?: unknown;
}

export interface PostgresOfferInstance {
  id: string;
  offerId: string | null;
  departureDate: string | null;
  returnDate: string | null;
  pricePerPerson: number;
  capacity: number;
  availableCapacity: number;
  title: string | null;
  image: string | null;
  travelCategory: string;
  flightDetails: Record<string, unknown> | null;
  extrasCapacity: Record<string, unknown> | null;
  extrasAvailable: Record<string, unknown> | null;
  createdAt: string | null;
}

export function mapOfferInstance(
  doc: FirestoreOfferInstance,
): PostgresOfferInstance {
  // offerRef takes priority over offerId for Firestore → PG extraction
  const rawOfferRef = doc.offerRef ?? doc.offerId;

  return {
    id: extractDocId(doc),
    offerId: normalizeNull(extractFirestoreId(rawOfferRef)),
    departureDate: normalizeNull(toISOString(doc.departureDate)),
    returnDate: normalizeNull(toISOString(doc.returnDate)),
    pricePerPerson: normalizeNumber(doc.pricePerPerson),
    capacity: normalizeNumber(doc.capacity),
    availableCapacity: normalizeNumber(doc.availableCapacity),
    title: normalizeNull(normalizeString(doc.title) || null),
    image: normalizeNull(normalizeString(doc.image) || null),
    travelCategory: normalizeString(doc.travelCategory),
    flightDetails: deepCleanFirestore(doc.flightDetails) as Record<
      string,
      unknown
    > | null,
    extrasCapacity: deepCleanFirestore(doc.extrasCapacity) as Record<
      string,
      unknown
    > | null,
    extrasAvailable: deepCleanFirestore(doc.extrasAvailable) as Record<
      string,
      unknown
    > | null,
    createdAt: normalizeNull(toISOString(doc.createdAt)),
  };
}

export function mapOfferInstances(
  docs: FirestoreOfferInstance[],
): PostgresOfferInstance[] {
  return docs.map(mapOfferInstance);
}
