/**
 * Firestore → PostgreSQL transformation utilities.
 *
 * Handles the two common Timestamp shapes produced by firebase-admin:
 *   { seconds, nanoseconds }        (Timestamp.toJSON())
 *   { _seconds, _nanoseconds }      (internal Timestamp representation)
 *
 * Handles DocumentReference paths either as plain strings ("collection/id")
 * or as objects with a .path / ._path.segments property.
 */

export type FirestoreTimestamp =
  | { seconds: number; nanoseconds: number }
  | { _seconds: number; _nanoseconds: number };

export type FirestoreDoc = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isFirestoreTimestamp(
  value: unknown,
): value is FirestoreTimestamp {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    (typeof v.seconds === "number" && typeof v.nanoseconds === "number") ||
    (typeof v._seconds === "number" && typeof v._nanoseconds === "number")
  );
}

export function isFirestoreRef(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.path === "string" ||
    (typeof v._path === "object" && v._path !== null) ||
    (typeof v.id === "string" && typeof v.firestore === "object")
  );
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

export function toISOString(value: unknown): string | null {
  if (!value && value !== 0) return null;
  if (isFirestoreTimestamp(value)) {
    const ts = value as Record<string, number>;
    const secs = ts.seconds ?? ts._seconds;
    return new Date(secs * 1000).toISOString();
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString();
  }
  return null;
}

/**
 * Extract the last path segment from a Firestore reference.
 * Supports:
 *  - "collection/docId"      → "docId"
 *  - "a/b/c/docId"           → "docId"
 *  - { path: "col/docId" }   → "docId"
 *  - { id: "docId" }         → "docId"
 *  - { _path: { segments: ["col","docId"] } }
 */
export function extractFirestoreId(ref: unknown): string | null {
  if (!ref) return null;

  if (typeof ref === "string") {
    const trimmed = ref.trim();
    if (!trimmed) return null;
    const parts = trimmed.split("/");
    return parts[parts.length - 1] || null;
  }

  if (typeof ref === "object" && ref !== null) {
    const r = ref as Record<string, unknown>;

    if (typeof r.path === "string") {
      const parts = r.path.split("/");
      return parts[parts.length - 1] || null;
    }

    if (typeof r.id === "string" && r.id) return r.id;

    if (r._path && typeof r._path === "object") {
      const p = r._path as Record<string, unknown>;
      if (Array.isArray(p.segments) && p.segments.length > 0) {
        return String(p.segments[p.segments.length - 1]);
      }
    }
  }

  return null;
}

export function extractDocId(doc: FirestoreDoc): string {
  return normalizeString(doc["_id"] ?? doc["id"] ?? doc["docId"]);
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

export function normalizeNull<T>(value: T | null | undefined): T | null {
  return value ?? null;
}

export function normalizeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function normalizeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return isNaN(n) ? fallback : n;
}

export function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  return value === 1 || value === "true" || value === "1";
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  return [];
}

export function normalizeEnum<T extends string>(
  value: unknown,
  validValues: readonly T[],
  fallback: T,
): T {
  if (typeof value === "string" && (validValues as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

/**
 * Recursively strip Firestore-specific types from a plain object (e.g. JSONB fields).
 * Timestamps become ISO strings; DocumentReferences become their path string.
 * __collections__ metadata fields are removed.
 */
export function deepCleanFirestore(value: unknown): unknown {
  if (value === null || value === undefined) return null;

  if (isFirestoreTimestamp(value)) {
    return toISOString(value);
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(deepCleanFirestore);
  }

  if (typeof value === "object") {
    if (isFirestoreRef(value)) {
      const r = value as Record<string, unknown>;
      return typeof r.path === "string" ? r.path : null;
    }

    const obj = value as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "__collections__" || k === "__name__") continue;
      cleaned[k] = deepCleanFirestore(v);
    }
    return cleaned;
  }

  return value;
}
