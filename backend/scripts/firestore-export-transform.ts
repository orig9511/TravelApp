/**
 * Firestore → PostgreSQL migration pipeline.
 *
 * PHASE 1 – EXPORT   : Firestore → backend/data/raw/*.json
 * PHASE 2 – TRANSFORM: raw JSON → backend/data/transformed/*.json (seed-ready)
 *
 * Usage:  npm run transform
 * Full:   npm run migrate  (transform + seed)
 */

import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

import { mapAccommodations } from "./mappers/accommodations.mapper";
import { mapBookings } from "./mappers/bookings.mapper";
import { mapFavorites } from "./mappers/favorites.mapper";
import { mapFlights } from "./mappers/flights.mapper";
import { mapNotifications } from "./mappers/notifications.mapper";
import { mapOfferInstances } from "./mappers/offerInstances.mapper";
import { mapOffers } from "./mappers/offers.mapper";
import { mapReservations } from "./mappers/reservations.mapper";
import { mapUsers } from "./mappers/users.mapper";
import { FirestoreDoc } from "./mappers/shared.utils";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SERVICE_ACCOUNT_PATH = path.resolve(
  __dirname,
  "angular-firebase-project-b8af8-firebase-adminsdk-fbsvc-1bc9c7d49a.json",
);
const RAW_DIR = path.resolve(__dirname, "../data/raw");
const TRANSFORMED_DIR = path.resolve(__dirname, "../data/transformed");

// Ordered list: Firestore collection name → output filename (no extension)
const COLLECTIONS: Array<{ collection: string; filename: string }> = [
  { collection: "users", filename: "users" },
  { collection: "offers", filename: "offers" },
  { collection: "offerInstances", filename: "offerInstances" },
  { collection: "bookings", filename: "bookings" },
  { collection: "favorites", filename: "favorites" },
  { collection: "notifications", filename: "notifications" },
  { collection: "accommodations", filename: "accommodations" },
  { collection: "flights", filename: "flights" },
  { collection: "reservations", filename: "reservations" },
];

type MapperFn = (docs: FirestoreDoc[]) => unknown[];

const MAPPERS: Record<string, MapperFn> = {
  users: mapUsers as MapperFn,
  offers: mapOffers as MapperFn,
  offerinstances: mapOfferInstances as MapperFn,
  bookings: mapBookings as MapperFn,
  favorites: mapFavorites as MapperFn,
  notifications: mapNotifications as MapperFn,
  accommodations: mapAccommodations as MapperFn,
  flights: mapFlights as MapperFn,
  reservations: mapReservations as MapperFn,
};

// ---------------------------------------------------------------------------
// Firestore value serializer
// Converts Firestore-native types to plain JSON-compatible values.
// ---------------------------------------------------------------------------

function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;

  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof admin.firestore.DocumentReference) {
    return value.path; // "collection/docId"
  }

  if (value instanceof admin.firestore.GeoPoint) {
    return { latitude: value.latitude, longitude: value.longitude };
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = serializeValue(v);
    }
    return result;
  }

  return value;
}

// ---------------------------------------------------------------------------
// Phase 1: Export
// ---------------------------------------------------------------------------

async function exportCollection(
  db: admin.firestore.Firestore,
  collectionName: string,
): Promise<FirestoreDoc[]> {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc) => ({
    _id: doc.id,
    ...(serializeValue(doc.data()) as Record<string, unknown>),
  }));
}

async function runExport(
  db: admin.firestore.Firestore,
): Promise<Map<string, number>> {
  fs.mkdirSync(RAW_DIR, { recursive: true });

  const counts = new Map<string, number>();

  console.log("\n━━━ PHASE 1: EXPORT  (Firestore → raw JSON) ━━━\n");

  for (const { collection, filename } of COLLECTIONS) {
    process.stdout.write(`  [export]    ${collection.padEnd(20)}`);

    try {
      const docs = await exportCollection(db, collection);
      const outPath = path.join(RAW_DIR, `${filename}.json`);
      fs.writeFileSync(outPath, JSON.stringify(docs, null, 2), "utf8");
      counts.set(filename, docs.length);
      console.log(`${String(docs.length).padStart(4)} records → data/raw/${filename}.json`);
    } catch (err) {
      console.log(`FAILED – ${(err as Error).message}`);
      counts.set(filename, 0);
    }
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Phase 2: Transform
// ---------------------------------------------------------------------------

function runTransform(): Map<string, number> {
  fs.mkdirSync(TRANSFORMED_DIR, { recursive: true });

  const counts = new Map<string, number>();

  console.log("\n━━━ PHASE 2: TRANSFORM  (raw JSON → PostgreSQL seed-ready) ━━━\n");

  for (const { filename } of COLLECTIONS) {
    const rawPath = path.join(RAW_DIR, `${filename}.json`);

    if (!fs.existsSync(rawPath)) {
      console.log(`  [transform] ${filename.padEnd(20)}  – raw file missing, skip`);
      continue;
    }

    const mapper = MAPPERS[filename.toLowerCase()];
    if (!mapper) {
      console.warn(`  [transform] ${filename.padEnd(20)}  – no mapper found, skip`);
      continue;
    }

    let rawDocs: FirestoreDoc[];
    try {
      rawDocs = JSON.parse(fs.readFileSync(rawPath, "utf8")) as FirestoreDoc[];
    } catch (err) {
      console.error(
        `  [transform] ${filename}: parse error – ${(err as Error).message}`,
      );
      continue;
    }

    const transformed = mapper(rawDocs);
    const outPath = path.join(TRANSFORMED_DIR, `${filename}.json`);
    fs.writeFileSync(outPath, JSON.stringify(transformed, null, 2), "utf8");
    counts.set(filename, transformed.length);

    console.log(
      `  [transform] ${filename.padEnd(20)}${String(transformed.length).padStart(4)} records → data/transformed/${filename}.json`,
    );
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function printSummary(
  exportCounts: Map<string, number>,
  transformCounts: Map<string, number>,
): void {
  console.log("\n━━━ SUMMARY ━━━\n");
  console.log("  Collection           Export  Transform");
  console.log("  ─────────────────────────────────────");

  let totalExport = 0;
  let totalTransform = 0;

  for (const { filename } of COLLECTIONS) {
    const exp = exportCounts.get(filename) ?? 0;
    const tr = transformCounts.get(filename) ?? 0;
    totalExport += exp;
    totalTransform += tr;
    console.log(
      `  ${filename.padEnd(20)} ${String(exp).padStart(5)}  ${String(tr).padStart(5)}`,
    );
  }

  console.log("  ─────────────────────────────────────");
  console.log(
    `  ${"TOTAL".padEnd(20)} ${String(totalExport).padStart(5)}  ${String(totalTransform).padStart(5)}`,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  console.log("\n╔═════════════════════════════════════════════════════╗");
  console.log("║    Firestore → PostgreSQL  Migration Pipeline       ║");
  console.log("╚═════════════════════════════════════════════════════╝");

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`\n[error] Service account not found:\n  ${SERVICE_ACCOUNT_PATH}`);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"),
  ) as admin.ServiceAccount & { project_id: string };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();
  console.log(`\n[init]  Project : ${serviceAccount.project_id}`);
  console.log(`[init]  Raw dir : ${RAW_DIR}`);
  console.log(`[init]  Out dir : ${TRANSFORMED_DIR}`);

  const exportCounts = await runExport(db);
  const transformCounts = runTransform();

  printSummary(exportCounts, transformCounts);

  console.log("\n[done] Pipeline complete.");
  console.log("[done] Next step: npm run seed   → load into PostgreSQL\n");

  await admin.app().delete();
}

run().catch((err) => {
  console.error("\n[fatal]", err);
  process.exit(1);
});
