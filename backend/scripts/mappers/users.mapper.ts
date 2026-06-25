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

const VALID_ROLES = ["admin", "advertiser", "customer"] as const;
type UserRole = (typeof VALID_ROLES)[number];

export interface FirestoreUser extends FirestoreDoc {
  firstName?: unknown;
  lastName?: unknown;
  username?: unknown;
  email?: unknown;
  passwordHash?: unknown;
  role?: unknown;
  dateOfBirth?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PostgresUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  dateOfBirth: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function mapUser(doc: FirestoreUser): PostgresUser {
  return {
    id: extractDocId(doc),
    firstName: normalizeString(doc.firstName),
    lastName: normalizeString(doc.lastName),
    username: normalizeString(doc.username),
    email: normalizeString(doc.email),
    passwordHash: normalizeString(doc.passwordHash),
    role: normalizeEnum(doc.role, VALID_ROLES, "customer"),
    dateOfBirth: normalizeNull(toISOString(doc.dateOfBirth)),
    createdAt: normalizeNull(toISOString(doc.createdAt)),
    updatedAt: normalizeNull(toISOString(doc.updatedAt)),
  };
}

export function mapUsers(docs: FirestoreUser[]): PostgresUser[] {
  return docs.map(mapUser);
}
