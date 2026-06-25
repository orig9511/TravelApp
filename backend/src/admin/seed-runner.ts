import * as bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { DataSource } from "typeorm";

import { User, UserRole } from "../users/entities/user.entity";
import { Offer, TravelCategory } from "../offers/entities/offer.entity";
import { OfferInstance } from "../offer-instances/entities/offer-instance.entity";
import { Accommodation } from "../accommodations/entities/accommodation.entity";
import { Flight } from "../flights/entities/flight.entity";
import {
  Booking,
  BookingStatus,
  BookingType,
} from "../bookings/entities/booking.entity";
import { Favorite } from "../favorites/entities/favorite.entity";
import {
  Notification,
  NotificationType,
} from "../notifications/entities/notification.entity";
import { Reservation } from "../reservations/entities/reservation.entity";

import type { PostgresUser } from "../../scripts/mappers/users.mapper";
import type { PostgresOffer } from "../../scripts/mappers/offers.mapper";
import type { PostgresOfferInstance } from "../../scripts/mappers/offerInstances.mapper";
import type { PostgresBooking } from "../../scripts/mappers/bookings.mapper";
import type { PostgresFavorite } from "../../scripts/mappers/favorites.mapper";
import type { PostgresNotification } from "../../scripts/mappers/notifications.mapper";
import type { PostgresAccommodation } from "../../scripts/mappers/accommodations.mapper";
import type { PostgresFlight } from "../../scripts/mappers/flights.mapper";
import type { PostgresReservation } from "../../scripts/mappers/reservations.mapper";

export interface SeedResult {
  users: number;
  accommodations: number;
  flights: number;
  offers: number;
  offerInstances: number;
  bookings: number;
  favorites: number;
  notifications: number;
  reservations: number;
  total: number;
}

const TRANSFORMED_DIR = path.resolve(__dirname, "../../data/transformed");
const MIGRATION_PASSWORD = "Migration@2024!";

function buildDataSource(): DataSource {
  return new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    synchronize: false,
    logging: false,
    entities: [
      User,
      Offer,
      OfferInstance,
      Accommodation,
      Flight,
      Booking,
      Favorite,
      Notification,
      Reservation,
    ],
    connectTimeoutMS: 15000,
    extra: {
      // Session Pooler compatible — disable prepared statements
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 30000,
    },
  });
}

const idMap = new Map<string, string>();
const entityIds = {
  users: new Set<string>(),
  offers: new Set<string>(),
  offerInstances: new Set<string>(),
  accommodations: new Set<string>(),
  flights: new Set<string>(),
};

function resetMaps(): void {
  idMap.clear();
  entityIds.users.clear();
  entityIds.offers.clear();
  entityIds.offerInstances.clear();
  entityIds.accommodations.clear();
  entityIds.flights.clear();
}

function registerIds(
  records: Array<{ id: string }>,
  entitySet?: Set<string>,
): void {
  for (const r of records) {
    if (r.id) {
      if (!idMap.has(r.id)) idMap.set(r.id, randomUUID());
      entitySet?.add(r.id);
    }
  }
}

function resolveId(firestoreId: string | null | undefined): string | null {
  if (!firestoreId) return null;
  return idMap.get(firestoreId) ?? null;
}

function resolveFk(
  firestoreId: string | null | undefined,
  validSet: Set<string>,
): string | null {
  if (!firestoreId || !validSet.has(firestoreId)) return null;
  return idMap.get(firestoreId) ?? null;
}

function requireId(firestoreId: string | null | undefined): string {
  const uuid = resolveId(firestoreId);
  if (!uuid)
    throw new Error(`No UUID mapping for Firestore ID: "${firestoreId}"`);
  return uuid;
}

function loadTransformed<T>(filename: string, log: (msg: string) => void): T[] {
  const filePath = path.join(TRANSFORMED_DIR, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    log(`  [load]  ${filename.padEnd(20)} – file not found, skipping`);
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as T[];
    log(`  [load]  ${filename.padEnd(20)} ${data.length} records`);
    return data;
  } catch (err) {
    log(`  [load]  ${filename}: parse error – ${(err as Error).message}`);
    return [];
  }
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

async function resetDatabase(ds: DataSource): Promise<void> {
  await ds.query(`
    TRUNCATE TABLE
      notifications,
      favorites,
      bookings,
      offer_instances,
      offers,
      reservations,
      flights,
      accommodations,
      users
    RESTART IDENTITY CASCADE;
  `);
}

async function seedUsers(
  ds: DataSource,
  data: PostgresUser[],
  log: (m: string) => void,
): Promise<number> {
  if (!data.length) return 0;
  const repo = ds.getRepository(User);
  const migrationHash = await bcrypt.hash(MIGRATION_PASSWORD, 10);
  let needsMigrationPw = false;

  const entities = data.map((u) => {
    if (!u.passwordHash) needsMigrationPw = true;
    return repo.create({
      id: requireId(u.id),
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username || u.email.split("@")[0],
      email: u.email,
      passwordHash: u.passwordHash || migrationHash,
      role: (u.role as UserRole) ?? UserRole.CUSTOMER,
      dateOfBirth: toDate(u.dateOfBirth) ?? undefined,
    });
  });

  await repo.save(entities, { chunk: 50 });
  if (needsMigrationPw)
    log(
      `    ⚠  Some users had no passwordHash → assigned: "${MIGRATION_PASSWORD}"`,
    );
  return entities.length;
}

async function seedAccommodations(
  ds: DataSource,
  data: PostgresAccommodation[],
): Promise<number> {
  if (!data.length) return 0;
  const repo = ds.getRepository(Accommodation);
  const entities = data.map((d) =>
    repo.create({
      id: requireId(d.id),
      userId: resolveFk(d.userId, entityIds.users) ?? undefined,
      imageUrl: d.imageUrl,
      name: d.name,
      type: d.type,
      pricePerNight: d.pricePerNight,
      availablePlaces: d.availablePlaces,
      mobile: d.mobile,
      email: d.email,
      roomCount: d.roomCount,
      capacityPerAccommodation: d.capacityPerAccommodation,
      rating: d.rating,
      stars: d.stars,
      description: d.description,
      descriptionHu: d.descriptionHu ?? undefined,
      continent: d.continent,
      country: d.country,
      city: d.city,
      address: d.address,
      comment: d.comment,
      services: d.services,
    }),
  );
  await repo.save(entities, { chunk: 50 });
  return entities.length;
}

async function seedFlights(
  ds: DataSource,
  data: PostgresFlight[],
): Promise<number> {
  if (!data.length) return 0;
  const repo = ds.getRepository(Flight);
  const entities = data.map((d) =>
    repo.create({
      id: requireId(d.id),
      airline: d.airline,
      fromCode: d.fromCode,
      toCode: d.toCode,
      fromLabel: d.fromLabel,
      toLabel: d.toLabel,
      departAt: d.departAt,
      departDate: toDate(d.departDate) ?? undefined,
      arriveAt: d.arriveAt,
      price: d.price,
      currency: d.currency || "EUR",
      stopsCount: d.stopsCount,
      durationMinutes: d.durationMinutes,
      isRefundable: d.isRefundable,
      hasBaggage: d.hasBaggage,
      availableSeats: d.availableSeats,
    }),
  );
  await repo.save(entities, { chunk: 50 });
  return entities.length;
}

async function seedOffers(
  ds: DataSource,
  data: PostgresOffer[],
): Promise<number> {
  if (!data.length) return 0;
  const repo = ds.getRepository(Offer);
  const entities = data.map((o) =>
    repo.create({
      id: requireId(o.id),
      title: o.title,
      titleEn: o.titleEn ?? undefined,
      shortDescription: o.shortDescription,
      shortDescriptionEn: o.shortDescriptionEn ?? undefined,
      description: o.description,
      travelCategory: o.travelCategory as TravelCategory,
      location: o.location,
      country: o.country,
      continent: o.continent,
      price: o.price,
      currency: o.currency || "EUR",
      days: o.days,
      nights: o.nights,
      persons: o.persons,
      hotelName: o.hotelName,
      hotelStars: o.hotelStars,
      hotelAddress: o.hotelAddress,
      hotelPhone: o.hotelPhone,
      hotelEmail: o.hotelEmail,
      images: o.images,
      travelPeriodStart: toDate(o.travelPeriodStart) ?? new Date(),
      travelPeriodEnd: toDate(o.travelPeriodEnd) ?? new Date(),
      isInactive: o.isInactive ?? false,
      notShowable: o.notShowable ?? false,
      viewCount: o.viewCount ?? 0,
      favoriteCount: o.favoriteCount ?? 0,
      createdBy: resolveFk(o.createdBy, entityIds.users) ?? undefined,
    }),
  );
  await repo.save(entities, { chunk: 50 });
  return entities.length;
}

async function seedOfferInstances(
  ds: DataSource,
  data: PostgresOfferInstance[],
  log: (m: string) => void,
): Promise<number> {
  if (!data.length) return 0;
  const repo = ds.getRepository(OfferInstance);
  const valid = data.filter(
    (d) => resolveFk(d.offerId, entityIds.offers) !== null,
  );
  if (valid.length < data.length)
    log(
      `    ⚠  skipped ${data.length - valid.length} offerInstances with missing offerId`,
    );

  const entities = valid.map((d) =>
    repo.create({
      id: requireId(d.id),
      offerId: resolveFk(d.offerId, entityIds.offers)!,
      departureDate: toDate(d.departureDate) ?? new Date(),
      returnDate: toDate(d.returnDate) ?? undefined,
      pricePerPerson: d.pricePerPerson,
      capacity: d.capacity,
      availableCapacity: d.availableCapacity,
      title: d.title ?? undefined,
      image: d.image ?? undefined,
      travelCategory: d.travelCategory,
      flightDetails: d.flightDetails ?? undefined,
      extrasCapacity: d.extrasCapacity ?? undefined,
      extrasAvailable: d.extrasAvailable ?? undefined,
    }),
  );
  await repo.save(entities, { chunk: 50 });
  return entities.length;
}

async function seedBookings(
  ds: DataSource,
  data: PostgresBooking[],
  log: (m: string) => void,
): Promise<number> {
  if (!data.length) return 0;
  const repo = ds.getRepository(Booking);
  const valid = data.filter(
    (d) => resolveFk(d.userId, entityIds.users) !== null,
  );
  if (valid.length < data.length)
    log(
      `    ⚠  skipped ${data.length - valid.length} bookings with missing userId`,
    );

  const entities = valid.map((d) =>
    repo.create({
      id: requireId(d.id),
      bookingType: (d.bookingType as BookingType) ?? BookingType.OFFER,
      offerId: resolveFk(d.offerId, entityIds.offers) ?? undefined,
      offerInstanceId:
        resolveFk(d.offerInstanceId, entityIds.offerInstances) ?? undefined,
      userId: resolveFk(d.userId, entityIds.users)!,
      userEmail: d.userEmail,
      userName: d.userName,
      offerTitle: d.offerTitle,
      selectedDate: toDate(d.selectedDate) ?? undefined,
      quantity: d.quantity,
      idempotencyKey: d.idempotencyKey ?? undefined,
      pricePerPerson: d.pricePerPerson,
      totalPrice: d.totalPrice,
      status: (d.status as BookingStatus) ?? BookingStatus.PENDING,
      passengers: (d.passengers as any[]) ?? [],
      extras: (d.extras as any) ?? undefined,
    }),
  );
  await repo.save(entities, { chunk: 50 });
  return entities.length;
}

async function seedFavorites(
  ds: DataSource,
  data: PostgresFavorite[],
  log: (m: string) => void,
): Promise<number> {
  if (!data.length) return 0;
  const repo = ds.getRepository(Favorite);
  const valid = data.filter(
    (d) =>
      resolveFk(d.userId, entityIds.users) !== null &&
      resolveFk(d.offerId, entityIds.offers) !== null,
  );
  if (valid.length < data.length)
    log(
      `    ⚠  skipped ${data.length - valid.length} favorites with missing FK`,
    );

  const entities = valid.map((d) =>
    repo.create({
      id: requireId(d.id),
      userId: resolveFk(d.userId, entityIds.users)!,
      offerId: resolveFk(d.offerId, entityIds.offers)!,
      savedAt: toDate(d.savedAt) ?? new Date(),
    }),
  );
  await repo.save(entities, { chunk: 50 });
  return entities.length;
}

async function seedNotifications(
  ds: DataSource,
  data: PostgresNotification[],
  log: (m: string) => void,
): Promise<number> {
  if (!data.length) return 0;
  const repo = ds.getRepository(Notification);
  const valid = data.filter(
    (d) => resolveFk(d.userId, entityIds.users) !== null,
  );
  if (valid.length < data.length)
    log(
      `    ⚠  skipped ${data.length - valid.length} notifications with missing userId`,
    );

  const entities = valid.map((d) =>
    repo.create({
      id: requireId(d.id),
      userId: resolveFk(d.userId, entityIds.users)!,
      type: (d.type as NotificationType) ?? NotificationType.OFFER,
      title: d.title,
      message: d.message,
      relatedId: d.relatedId ?? undefined,
      read: d.read,
    }),
  );
  await repo.save(entities, { chunk: 50 });
  return entities.length;
}

async function seedReservations(
  ds: DataSource,
  data: PostgresReservation[],
  log: (m: string) => void,
): Promise<number> {
  if (!data.length) return 0;
  const repo = ds.getRepository(Reservation);
  const valid = data.filter(
    (d) =>
      resolveFk(d.accommodationId, entityIds.accommodations) !== null &&
      resolveFk(d.userId, entityIds.users) !== null,
  );
  if (valid.length < data.length)
    log(
      `    ⚠  skipped ${data.length - valid.length} reservations with missing FK`,
    );

  const entities = valid.map((d) =>
    repo.create({
      id: requireId(d.id),
      accommodationId: resolveFk(d.accommodationId, entityIds.accommodations)!,
      userId: resolveFk(d.userId, entityIds.users)!,
      flightId: resolveFk(d.flightId, entityIds.flights) ?? undefined,
      startDate: toDate(d.startDate) ?? new Date(),
      endDate: toDate(d.endDate) ?? new Date(),
      price: d.price,
      persons: d.persons,
    }),
  );
  await repo.save(entities, { chunk: 50 });
  return entities.length;
}

export async function runSeed(
  log: (msg: string) => void = console.log,
): Promise<SeedResult> {
  if (!fs.existsSync(TRANSFORMED_DIR)) {
    throw new Error(
      `Transformed data not found: ${TRANSFORMED_DIR}. Run: npm run transform first.`,
    );
  }

  resetMaps();

  log("[load]  Reading transformed data...");
  const users = loadTransformed<PostgresUser>("users", log);
  const offers = loadTransformed<PostgresOffer>("offers", log);
  const offerInstances = loadTransformed<PostgresOfferInstance>(
    "offerInstances",
    log,
  );
  const bookings = loadTransformed<PostgresBooking>("bookings", log);
  const favorites = loadTransformed<PostgresFavorite>("favorites", log);
  const notifications = loadTransformed<PostgresNotification>(
    "notifications",
    log,
  );
  const accommodations = loadTransformed<PostgresAccommodation>(
    "accommodations",
    log,
  );
  const flights = loadTransformed<PostgresFlight>("flights", log);
  const reservations = loadTransformed<PostgresReservation>(
    "reservations",
    log,
  );

  const totalInput =
    users.length +
    offers.length +
    offerInstances.length +
    bookings.length +
    favorites.length +
    notifications.length +
    accommodations.length +
    flights.length +
    reservations.length;

  if (totalInput === 0) {
    throw new Error(
      "All transformed files are empty. Run: npm run transform first.",
    );
  }

  registerIds(users, entityIds.users);
  registerIds(offers, entityIds.offers);
  registerIds(offerInstances, entityIds.offerInstances);
  registerIds(bookings);
  registerIds(favorites);
  registerIds(notifications);
  registerIds(accommodations, entityIds.accommodations);
  registerIds(flights, entityIds.flights);
  registerIds(reservations);
  log(`[uuid]  Generated ${idMap.size} UUID mappings`);

  log("[db]    Connecting to Supabase...");
  const ds = buildDataSource();
  await ds.initialize();
  log(`[db]    Connected. SSL active.`);

  log("[db]    Truncating all tables...");
  await resetDatabase(ds);
  log("[db]    Tables cleared.");

  try {
    const result: SeedResult = {
      users: 0,
      accommodations: 0,
      flights: 0,
      offers: 0,
      offerInstances: 0,
      bookings: 0,
      favorites: 0,
      notifications: 0,
      reservations: 0,
      total: 0,
    };

    log("[seed]  Seeding users...");
    result.users = await seedUsers(ds, users, log);
    log(`[seed]  users: ${result.users} inserted`);

    log("[seed]  Seeding accommodations...");
    result.accommodations = await seedAccommodations(ds, accommodations);
    log(`[seed]  accommodations: ${result.accommodations} inserted`);

    log("[seed]  Seeding flights...");
    result.flights = await seedFlights(ds, flights);
    log(`[seed]  flights: ${result.flights} inserted`);

    log("[seed]  Seeding offers...");
    result.offers = await seedOffers(ds, offers);
    log(`[seed]  offers: ${result.offers} inserted`);

    log("[seed]  Seeding offerInstances...");
    result.offerInstances = await seedOfferInstances(ds, offerInstances, log);
    log(`[seed]  offerInstances: ${result.offerInstances} inserted`);

    log("[seed]  Seeding bookings...");
    result.bookings = await seedBookings(ds, bookings, log);
    log(`[seed]  bookings: ${result.bookings} inserted`);

    log("[seed]  Seeding favorites...");
    result.favorites = await seedFavorites(ds, favorites, log);
    log(`[seed]  favorites: ${result.favorites} inserted`);

    log("[seed]  Seeding notifications...");
    result.notifications = await seedNotifications(ds, notifications, log);
    log(`[seed]  notifications: ${result.notifications} inserted`);

    log("[seed]  Seeding reservations...");
    result.reservations = await seedReservations(ds, reservations, log);
    log(`[seed]  reservations: ${result.reservations} inserted`);

    result.total =
      Object.values(result).reduce(
        (s, v) => s + (typeof v === "number" ? v : 0),
        0,
      ) - result.total;
    result.total =
      result.users +
      result.accommodations +
      result.flights +
      result.offers +
      result.offerInstances +
      result.bookings +
      result.favorites +
      result.notifications +
      result.reservations;

    log(`[seed]  COMPLETE — ${result.total} total records inserted`);
    return result;
  } finally {
    await ds.destroy();
  }
}
