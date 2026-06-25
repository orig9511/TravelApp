import {
  extractDocId,
  extractFirestoreId,
  FirestoreDoc,
  normalizeBoolean,
  normalizeEnum,
  normalizeNull,
  normalizeString,
  toISOString,
} from "./shared.utils";

const VALID_TYPES = ["booking", "offer"] as const;
type NotificationType = (typeof VALID_TYPES)[number];

export interface FirestoreNotification extends FirestoreDoc {
  /** Firestore ref or "users/userId" */
  userRef?: unknown;
  userId?: unknown;
  type?: unknown;
  title?: unknown;
  message?: unknown;
  relatedId?: unknown;
  read?: unknown;
  createdAt?: unknown;
}

export interface PostgresNotification {
  id: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  relatedId: string | null;
  read: boolean;
  createdAt: string | null;
}

export function mapNotification(
  doc: FirestoreNotification,
): PostgresNotification {
  return {
    id: extractDocId(doc),
    userId: normalizeNull(extractFirestoreId(doc.userRef ?? doc.userId)),
    type: normalizeEnum(doc.type, VALID_TYPES, "offer"),
    title: normalizeString(doc.title),
    message: normalizeString(doc.message),
    relatedId: normalizeNull(normalizeString(doc.relatedId) || null),
    read: normalizeBoolean(doc.read),
    createdAt: normalizeNull(toISOString(doc.createdAt)),
  };
}

export function mapNotifications(
  docs: FirestoreNotification[],
): PostgresNotification[] {
  return docs.map(mapNotification);
}
