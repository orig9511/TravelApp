import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import { User } from "./users/entities/user.entity";
import { Offer } from "./offers/entities/offer.entity";
import { OfferInstance } from "./offer-instances/entities/offer-instance.entity";
import { Booking } from "./bookings/entities/booking.entity";
import { Accommodation } from "./accommodations/entities/accommodation.entity";
import { Reservation } from "./reservations/entities/reservation.entity";
import { Flight } from "./flights/entities/flight.entity";
import { Favorite } from "./favorites/entities/favorite.entity";
import { Notification } from "./notifications/entities/notification.entity";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  logging: false,
  entities: [
    User,
    Offer,
    OfferInstance,
    Booking,
    Accommodation,
    Reservation,
    Flight,
    Favorite,
    Notification,
  ],
  migrations: ["src/migrations/**/*.ts"],
});
