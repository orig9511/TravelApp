import {
  extractDocId,
  extractFirestoreId,
  FirestoreDoc,
  normalizeNull,
  normalizeNumber,
  normalizeString,
  normalizeStringArray,
  toISOString,
} from "./shared.utils";

export interface FirestoreAccommodation extends FirestoreDoc {
  /** Optional Firestore ref or "users/userId" */
  userRef?: unknown;
  userId?: unknown;
  imageUrl?: unknown;
  name?: unknown;
  type?: unknown;
  pricePerNight?: unknown;
  /** Legacy field names from the Angular project */
  price?: unknown;
  availablePlaces?: unknown;
  available_rooms?: unknown;
  mobile?: unknown;
  phone_number?: unknown;
  email?: unknown;
  roomCount?: unknown;
  rooms?: unknown;
  capacityPerAccommodation?: unknown;
  persons?: unknown;
  capacity?: unknown;
  rating?: unknown;
  travelers_rating?: unknown;
  stars?: unknown;
  description?: unknown;
  description_hu?: unknown;
  continent?: unknown;
  country?: unknown;
  city?: unknown;
  address?: unknown;
  comment?: unknown;
  comments?: unknown;
  services?: unknown;
  createdAt?: unknown;
}

export interface PostgresAccommodation {
  id: string;
  userId: string | null;
  imageUrl: string;
  name: string;
  type: string;
  pricePerNight: number;
  availablePlaces: number;
  mobile: string;
  email: string;
  roomCount: number;
  capacityPerAccommodation: number;
  rating: number;
  stars: number;
  description: string;
  descriptionHu: string | null;
  continent: string;
  country: string;
  city: string;
  address: string;
  comment: string;
  services: string[];
  createdAt: string | null;
}

export function mapAccommodation(
  doc: FirestoreAccommodation,
): PostgresAccommodation {
  const comment = Array.isArray(doc.comments)
    ? (doc.comments as unknown[]).map(String).join(", ")
    : normalizeString(doc.comment);

  return {
    id: extractDocId(doc),
    userId: normalizeNull(extractFirestoreId(doc.userRef ?? doc.userId)),
    imageUrl: normalizeString(doc.imageUrl),
    name: normalizeString(doc.name),
    type: normalizeString(doc.type, "hotel"),
    pricePerNight: normalizeNumber(doc.pricePerNight ?? doc.price),
    availablePlaces: normalizeNumber(
      doc.availablePlaces ?? doc.available_rooms ?? doc.capacity,
    ),
    mobile: normalizeString(doc.mobile ?? doc.phone_number),
    email: normalizeString(doc.email),
    roomCount: normalizeNumber(doc.roomCount ?? doc.rooms),
    capacityPerAccommodation: normalizeNumber(
      doc.capacityPerAccommodation ?? doc.persons ?? doc.capacity,
      2,
    ),
    rating: normalizeNumber(doc.rating ?? doc.travelers_rating),
    stars: normalizeNumber(doc.stars ?? doc.rating),
    description: normalizeString(doc.description),
    descriptionHu: normalizeNull(normalizeString(doc.description_hu)),
    continent: normalizeString(doc.continent),
    country: normalizeString(doc.country),
    city: normalizeString(doc.city),
    address: normalizeString(doc.address),
    comment,
    services: normalizeStringArray(doc.services),
    createdAt: normalizeNull(toISOString(doc.createdAt)),
  };
}

export function mapAccommodations(
  docs: FirestoreAccommodation[],
): PostgresAccommodation[] {
  return docs.map(mapAccommodation);
}
