import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccommodationsController } from "./accommodations.controller";
import { AccommodationsService } from "./accommodations.service";
import { Accommodation } from "./entities/accommodation.entity";
import { Reservation } from "../reservations/entities/reservation.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Accommodation, Reservation])],
  controllers: [AccommodationsController],
  providers: [AccommodationsService],
  exports: [AccommodationsService],
})
export class AccommodationsModule {}
