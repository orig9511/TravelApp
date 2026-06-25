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
  normalizeStringArray,
  toISOString,
} from "./shared.utils";

const VALID_CATEGORIES = ["flight", "individual", "tour"] as const;
type TravelCategory = (typeof VALID_CATEGORIES)[number];

export interface FirestoreOffer extends FirestoreDoc {
  title?: unknown;
  titleEn?: unknown;
  shortDescription?: unknown;
  shortDescriptionEn?: unknown;
  description?: unknown;
  descriptionEn?: unknown;
  travelCategory?: unknown;
  location?: unknown;
  country?: unknown;
  continent?: unknown;
  price?: unknown;
  currency?: unknown;
  days?: unknown;
  nights?: unknown;
  persons?: unknown;
  hotelName?: unknown;
  hotelStars?: unknown;
  hotelAddress?: unknown;
  hotelPhone?: unknown;
  hotelEmail?: unknown;
  images?: unknown;
  travelPeriodStart?: unknown;
  travelPeriodEnd?: unknown;
  isInactive?: unknown;
  notShowable?: unknown;
  viewCount?: unknown;
  favoriteCount?: unknown;
  /** Firestore DocumentReference or "users/userId" string */
  createdBy?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PostgresOffer {
  id: string;
  title: string;
  titleEn: string | null;
  shortDescription: string;
  shortDescriptionEn: string | null;
  description: string;
  descriptionEn: string | null;
  travelCategory: TravelCategory;
  location: string;
  country: string;
  continent: string;
  price: number;
  currency: string;
  days: number;
  nights: number;
  persons: number;
  hotelName: string;
  hotelStars: number;
  hotelAddress: string;
  hotelPhone: string;
  hotelEmail: string;
  images: string[];
  travelPeriodStart: string | null;
  travelPeriodEnd: string | null;
  isInactive: boolean;
  notShowable: boolean;
  viewCount: number;
  favoriteCount: number;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function mapOffer(doc: FirestoreOffer): PostgresOffer {
  return {
    id: extractDocId(doc),
    title: normalizeString(doc.title),
    titleEn: normalizeNull(normalizeString(doc.titleEn) || null),
    shortDescription: normalizeString(doc.shortDescription),
    shortDescriptionEn: normalizeNull(
      normalizeString(doc.shortDescriptionEn) || null,
    ),
    description: normalizeString(doc.description),
    descriptionEn: normalizeNull(normalizeString(doc.descriptionEn) || null),
    travelCategory: normalizeEnum(
      doc.travelCategory,
      VALID_CATEGORIES,
      "individual",
    ),
    location: normalizeString(doc.location),
    country: normalizeString(doc.country),
    continent: normalizeString(doc.continent),
    price: normalizeNumber(doc.price),
    currency: normalizeString(doc.currency, "EUR"),
    days: normalizeNumber(doc.days),
    nights: normalizeNumber(doc.nights),
    persons: normalizeNumber(doc.persons, 2),
    hotelName: normalizeString(doc.hotelName),
    hotelStars: normalizeNumber(doc.hotelStars),
    hotelAddress: normalizeString(doc.hotelAddress),
    hotelPhone: normalizeString(doc.hotelPhone),
    hotelEmail: normalizeString(doc.hotelEmail),
    images: normalizeStringArray(doc.images),
    travelPeriodStart: normalizeNull(toISOString(doc.travelPeriodStart)),
    travelPeriodEnd: normalizeNull(toISOString(doc.travelPeriodEnd)),
    isInactive: normalizeBoolean(doc.isInactive),
    notShowable: normalizeBoolean(doc.notShowable),
    viewCount: normalizeNumber(doc.viewCount),
    favoriteCount: normalizeNumber(doc.favoriteCount),
    // "users/userId" → "userId"
    createdBy: normalizeNull(extractFirestoreId(doc.createdBy)),
    createdAt: normalizeNull(toISOString(doc.createdAt)),
    updatedAt: normalizeNull(toISOString(doc.updatedAt)),
  };
}

export function mapOffers(docs: FirestoreOffer[]): PostgresOffer[] {
  return docs.map(mapOffer);
}
