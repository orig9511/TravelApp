import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReservationsController } from "./reservations.controller";
import { ReservationsService } from "./reservations.service";
import { Reservation } from "./entities/reservation.entity";
import { Accommodation } from "../accommodations/entities/accommodation.entity";
import { BookingEngineModule } from "../booking-engine/booking-engine.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Accommodation]),
    BookingEngineModule,
    NotificationsModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
