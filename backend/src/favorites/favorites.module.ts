import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FavoritesController } from "./favorites.controller";
import { FavoritesService } from "./favorites.service";
import { Favorite } from "./entities/favorite.entity";
import { Offer } from "../offers/entities/offer.entity";
import { Accommodation } from "../accommodations/entities/accommodation.entity";
import { OffersModule } from "../offers/offers.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Favorite, Offer, Accommodation]),
    OffersModule,
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
