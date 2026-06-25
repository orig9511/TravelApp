import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookingEngineService } from "./booking-engine.service";
import { Booking } from "../bookings/entities/booking.entity";
import { OfferInstance } from "../offer-instances/entities/offer-instance.entity";
import { Offer } from "../offers/entities/offer.entity";
import { User } from "../users/entities/user.entity";
import { Reservation } from "../reservations/entities/reservation.entity";
import { Accommodation } from "../accommodations/entities/accommodation.entity";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      OfferInstance,
      Offer,
      User,
      Reservation,
      Accommodation,
    ]),
    NotificationsModule,
  ],
  providers: [BookingEngineService],
  exports: [BookingEngineService],
})
export class BookingEngineModule {}
