import {
  extractDocId,
  extractFirestoreId,
  FirestoreDoc,
  normalizeNull,
  toISOString,
} from "./shared.utils";

export interface FirestoreFavorite extends FirestoreDoc {
  /** Firestore ref or "users/userId" */
  userRef?: unknown;
  userId?: unknown;
  /** Firestore ref or "offers/offerId" */
  offerRef?: unknown;
  offerId?: unknown;
  savedAt?: unknown;
  createdAt?: unknown;
}

export interface PostgresFavorite {
  id: string;
  userId: string | null;
  offerId: string | null;
  savedAt: string | null;
}

export function mapFavorite(doc: FirestoreFavorite): PostgresFavorite {
  const savedAt = doc.savedAt ?? doc.createdAt;
  return {
    id: extractDocId(doc),
    userId: normalizeNull(extractFirestoreId(doc.userRef ?? doc.userId)),
    offerId: normalizeNull(extractFirestoreId(doc.offerRef ?? doc.offerId)),
    savedAt: normalizeNull(toISOString(savedAt)),
  };
}

export function mapFavorites(docs: FirestoreFavorite[]): PostgresFavorite[] {
  return docs.map(mapFavorite);
}
