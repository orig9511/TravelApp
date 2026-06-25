import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OfferInstancesController } from "./offer-instances.controller";
import { OfferInstancesService } from "./offer-instances.service";
import { OfferInstance } from "./entities/offer-instance.entity";
import { Offer } from "../offers/entities/offer.entity";

@Module({
  imports: [TypeOrmModule.forFeature([OfferInstance, Offer])],
  controllers: [OfferInstancesController],
  providers: [OfferInstancesService],
  exports: [OfferInstancesService],
})
export class OfferInstancesModule {}
