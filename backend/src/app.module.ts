import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { OffersModule } from "./offers/offers.module";
import { OfferInstancesModule } from "./offer-instances/offer-instances.module";
import { BookingEngineModule } from "./booking-engine/booking-engine.module";
import { BookingsModule } from "./bookings/bookings.module";
import { AccommodationsModule } from "./accommodations/accommodations.module";
import { ReservationsModule } from "./reservations/reservations.module";
import { FlightsModule } from "./flights/flights.module";
import { FavoritesModule } from "./favorites/favorites.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AdminModule } from "./admin/admin.module";
import { UploadModule } from "./upload/upload.module";

import { User } from "./users/entities/user.entity";
import { Offer } from "./offers/entities/offer.entity";
import { OfferInstance } from "./offer-instances/entities/offer-instance.entity";
import { Booking } from "./bookings/entities/booking.entity";
import { Accommodation } from "./accommodations/entities/accommodation.entity";
import { Reservation } from "./reservations/entities/reservation.entity";
import { Flight } from "./flights/entities/flight.entity";
import { Favorite } from "./favorites/entities/favorite.entity";
import { Notification } from "./notifications/entities/notification.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
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
    }),

    AuthModule,
    UsersModule,
    OffersModule,
    OfferInstancesModule,
    BookingEngineModule,
    BookingsModule,
    AccommodationsModule,
    ReservationsModule,
    FlightsModule,
    FavoritesModule,
    NotificationsModule,
    AdminModule,
    UploadModule,
  ],
})
export class AppModule {}
