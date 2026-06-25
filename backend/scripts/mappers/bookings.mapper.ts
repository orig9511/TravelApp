import {
  deepCleanFirestore,
  extractDocId,
  extractFirestoreId,
  FirestoreDoc,
  normalizeBoolean,
  normalizeEnum,
  normalizeNull,
  normalizeNumber,
  normalizeString,
  toISOString,
} from "./shared.utils";

const VALID_STATUSES = ["pending", "confirmed", "cancelled"] as const;
const VALID_TYPES = ["offer", "flight"] as const;

type BookingStatus = (typeof VALID_STATUSES)[number];
type BookingType = (typeof VALID_TYPES)[number];

export interface FirestoreBooking extends FirestoreDoc {
  bookingType?: unknown;
  /** Firestore ref or "offers/offerId" */
  offerRef?: unknown;
  offerId?: unknown;
  /** Firestore ref or "offer_instances/id" */
  offerInstanceRef?: unknown;
  offerInstanceId?: unknown;
  /** Firestore ref or "users/userId" */
  userRef?: unknown;
  userId?: unknown;
  userEmail?: unknown;
  userName?: unknown;
  offerTitle?: unknown;
  selectedDate?: unknown;
  quantity?: unknown;
  idempotencyKey?: unknown;
  pricePerPerson?: unknown;
  totalPrice?: unknown;
  status?: unknown;
  passengers?: unknown;
  extras?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PostgresBooking {
  id: string;
  bookingType: BookingType;
  offerId: string | null;
  offerInstanceId: string | null;
  userId: string | null;
  userEmail: string;
  userName: string;
  offerTitle: string;
  selectedDate: string | null;
  quantity: number;
  idempotencyKey: string | null;
  pricePerPerson: number;
  totalPrice: number;
  status: BookingStatus;
  passengers: unknown[];
  extras: Record<string, unknown> | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function mapBooking(doc: FirestoreBooking): PostgresBooking {
  return {
    id: extractDocId(doc),
    bookingType: normalizeEnum(doc.bookingType, VALID_TYPES, "offer"),
    offerId: normalizeNull(extractFirestoreId(doc.offerRef ?? doc.offerId)),
    offerInstanceId: normalizeNull(
      extractFirestoreId(doc.offerInstanceRef ?? doc.offerInstanceId),
    ),
    userId: normalizeNull(extractFirestoreId(doc.userRef ?? doc.userId)),
    userEmail: normalizeString(doc.userEmail),
    userName: normalizeString(doc.userName),
    offerTitle: normalizeString(doc.offerTitle),
    selectedDate: normalizeNull(toISOString(doc.selectedDate)),
    quantity: normalizeNumber(doc.quantity, 1),
    idempotencyKey: normalizeNull(normalizeString(doc.idempotencyKey) || null),
    pricePerPerson: normalizeNumber(doc.pricePerPerson),
    totalPrice: normalizeNumber(doc.totalPrice),
    status: normalizeEnum(doc.status, VALID_STATUSES, "pending"),
    passengers: Array.isArray(doc.passengers)
      ? (doc.passengers.map(deepCleanFirestore) as unknown[])
      : [],
    extras: deepCleanFirestore(doc.extras) as Record<string, unknown> | null,
    createdAt: normalizeNull(toISOString(doc.createdAt)),
    updatedAt: normalizeNull(toISOString(doc.updatedAt)),
  };
}

export function mapBookings(docs: FirestoreBooking[]): PostgresBooking[] {
  return docs.map(mapBooking);
}
