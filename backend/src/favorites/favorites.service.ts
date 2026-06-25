import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Favorite } from "./entities/favorite.entity";
import { Offer } from "../offers/entities/offer.entity";
import { Accommodation } from "../accommodations/entities/accommodation.entity";
import { OffersService } from "../offers/offers.service";

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Accommodation)
    private readonly accommodationRepository: Repository<Accommodation>,
    private readonly offersService: OffersService,
  ) {}

  async getUserFavorites(userId: string): Promise<Favorite[]> {
    return this.favoriteRepository.find({
      where: { userId },
      relations: ["offer", "accommodation"],
      order: { savedAt: "DESC" },
    });
  }

  async toggle(
    userId: string,
    offerId: string,
  ): Promise<{ favorited: boolean }> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
    });
    if (!offer) throw new NotFoundException("Offer not found");

    const existing = await this.favoriteRepository.findOne({
      where: { userId, offerId },
    });

    if (existing) {
      await this.favoriteRepository.remove(existing);
      await this.offersService.decrementFavoriteCount(offerId);
      return { favorited: false };
    } else {
      const fav = this.favoriteRepository.create({
        userId,
        offerId,
        accommodationId: null,
      });
      await this.favoriteRepository.save(fav);
      await this.offersService.incrementFavoriteCount(offerId);
      return { favorited: true };
    }
  }

  async toggleAccommodation(
    userId: string,
    accommodationId: string,
  ): Promise<{ favorited: boolean }> {
    const accommodation = await this.accommodationRepository.findOne({
      where: { id: accommodationId },
    });
    if (!accommodation) throw new NotFoundException("Accommodation not found");

    const existing = await this.favoriteRepository.findOne({
      where: { userId, accommodationId },
    });

    if (existing) {
      await this.favoriteRepository.remove(existing);
      return { favorited: false };
    } else {
      const fav = this.favoriteRepository.create({
        userId,
        accommodationId,
        offerId: null,
      });
      await this.favoriteRepository.save(fav);
      return { favorited: true };
    }
  }

  async isFavorite(userId: string, offerId: string): Promise<boolean> {
    const existing = await this.favoriteRepository.findOne({
      where: { userId, offerId },
    });
    return !!existing;
  }

  async isAccommodationFavorite(
    userId: string,
    accommodationId: string,
  ): Promise<boolean> {
    const existing = await this.favoriteRepository.findOne({
      where: { userId, accommodationId },
    });
    return !!existing;
  }

  async getUsersWhoFavorited(offerId: string): Promise<string[]> {
    const favorites = await this.favoriteRepository.find({
      where: { offerId },
      select: ["userId"],
    });
    return favorites.map((f) => f.userId);
  }

  async remove(userId: string, offerId: string): Promise<void> {
    const fav = await this.favoriteRepository.findOne({
      where: { userId, offerId },
    });
    if (!fav) throw new NotFoundException("Favorite not found");
    await this.favoriteRepository.remove(fav);
    await this.offersService.decrementFavoriteCount(offerId);
  }
}
