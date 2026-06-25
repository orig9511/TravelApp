import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FlightsController } from "./flights.controller";
import { FlightsService } from "./flights.service";
import { Flight } from "./entities/flight.entity";
import { Booking } from "../bookings/entities/booking.entity";
import { User } from "../users/entities/user.entity";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [TypeOrmModule.forFeature([Flight, Booking, User]), NotificationsModule],
  controllers: [FlightsController],
  providers: [FlightsService],
  exports: [FlightsService],
})
export class FlightsModule {}
