import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { Offer, TravelCategory } from "./entities/offer.entity";
import { CreateOfferDto } from "./dto/create-offer.dto";
import { UpdateOfferDto } from "./dto/update-offer.dto";
import { FilterOffersDto } from "./dto/filter-offers.dto";
import { UserRole } from "../users/entities/user.entity";

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
  ) {}

  async findAll(
    filter: FilterOffersDto,
    includeHidden = false,
  ): Promise<{ data: Offer[]; total: number; page: number; limit: number }> {
    const qb = this.buildFilterQuery(filter, includeHidden);

    const [data, total] = await qb
      .skip(filter.skip)
      .take(filter.limit)
      .getManyAndCount();

    return { data, total, page: filter.page ?? 1, limit: filter.limit ?? 20 };
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ["instances"],
    });
    if (!offer) throw new NotFoundException("Offer not found");
    return offer;
  }

  async create(dto: CreateOfferDto, userId: string): Promise<Offer> {
    const offer = this.offerRepository.create({
      ...dto,
      price: dto.price,
      travelPeriodStart: dto.travelPeriodStart
        ? new Date(dto.travelPeriodStart)
        : undefined,
      travelPeriodEnd: dto.travelPeriodEnd
        ? new Date(dto.travelPeriodEnd)
        : undefined,
      createdBy: userId,
    });
    return this.offerRepository.save(offer);
  }

  async update(
    id: string,
    dto: UpdateOfferDto,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<Offer> {
    const offer = await this.offerRepository.findOne({ where: { id } });
    if (!offer) throw new NotFoundException("Offer not found");

    if (requesterRole !== UserRole.ADMIN && offer.createdBy !== requesterId) {
      throw new ForbiddenException("You can only update your own offers");
    }

    Object.assign(offer, {
      ...dto,
      travelPeriodStart: dto.travelPeriodStart
        ? new Date(dto.travelPeriodStart)
        : offer.travelPeriodStart,
      travelPeriodEnd: dto.travelPeriodEnd
        ? new Date(dto.travelPeriodEnd)
        : offer.travelPeriodEnd,
    });

    return this.offerRepository.save(offer);
  }

  async remove(
    id: string,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<void> {
    const offer = await this.offerRepository.findOne({ where: { id } });
    if (!offer) throw new NotFoundException("Offer not found");

    if (requesterRole !== UserRole.ADMIN && offer.createdBy !== requesterId) {
      throw new ForbiddenException("You can only delete your own offers");
    }

    await this.offerRepository.remove(offer);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.offerRepository.increment({ id }, "viewCount", 1);
  }

  async incrementFavoriteCount(id: string): Promise<void> {
    await this.offerRepository.increment({ id }, "favoriteCount", 1);
  }

  async decrementFavoriteCount(id: string): Promise<void> {
    await this.offerRepository.decrement({ id }, "favoriteCount", 1);
  }

  async getTopByViews(limit = 10): Promise<Offer[]> {
    return this.offerRepository.find({
      where: { notShowable: false, isInactive: false },
      order: { viewCount: "DESC" },
      take: limit,
    });
  }

  async getTopByFavorites(limit = 10): Promise<Offer[]> {
    return this.offerRepository.find({
      where: { notShowable: false, isInactive: false },
      order: { favoriteCount: "DESC" },
      take: limit,
    });
  }

  async updateVisibility(
    id: string,
    payload: { isInactive?: boolean; notShowable?: boolean },
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<Offer> {
    const offer = await this.offerRepository.findOne({ where: { id } });
    if (!offer) throw new NotFoundException("Offer not found");

    if (requesterRole !== UserRole.ADMIN && offer.createdBy !== requesterId) {
      throw new ForbiddenException("You can only update your own offers");
    }

    if (payload.isInactive !== undefined) offer.isInactive = payload.isInactive;
    if (payload.notShowable !== undefined)
      offer.notShowable = payload.notShowable;

    return this.offerRepository.save(offer);
  }

  async getAnalytics(
    offerId: string,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<any> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
    });
    if (!offer) throw new NotFoundException("Offer not found");

    if (requesterRole !== UserRole.ADMIN && offer.createdBy !== requesterId) {
      throw new ForbiddenException("You can only view analytics for your own offers");
    }

    return {
      offerId,
      viewCount: offer.viewCount,
      favoriteCount: offer.favoriteCount,
    };
  }

  private buildFilterQuery(
    filter: FilterOffersDto,
    includeHidden: boolean,
  ): SelectQueryBuilder<Offer> {
    const qb = this.offerRepository
      .createQueryBuilder("offer")
      .orderBy("offer.createdAt", "DESC");

    if (!includeHidden) {
      qb.andWhere("offer.notShowable = false");
    }

    if (filter.minPrice !== undefined) {
      qb.andWhere("offer.price >= :minPrice", { minPrice: filter.minPrice });
    }
    if (filter.maxPrice !== undefined) {
      qb.andWhere("offer.price <= :maxPrice", { maxPrice: filter.maxPrice });
    }
    if (filter.minDays !== undefined) {
      qb.andWhere("offer.days >= :minDays", { minDays: filter.minDays });
    }
    if (filter.maxDays !== undefined) {
      qb.andWhere("offer.days <= :maxDays", { maxDays: filter.maxDays });
    }
    if (filter.persons !== undefined) {
      qb.andWhere("offer.persons >= :persons", { persons: filter.persons });
    }
    if (filter.minStars !== undefined) {
      qb.andWhere("offer.hotelStars >= :minStars", {
        minStars: filter.minStars,
      });
    }
    if (filter.travelCategory) {
      qb.andWhere("offer.travelCategory = :travelCategory", {
        travelCategory: filter.travelCategory,
      });
    }
    if (filter.continent) {
      qb.andWhere("offer.continent = :continent", {
        continent: filter.continent,
      });
    }
    if (filter.createdBy) {
      qb.andWhere("offer.createdBy = :createdBy", {
        createdBy: filter.createdBy,
      });
    }
    if (filter.travelDate) {
      const date = new Date(filter.travelDate);
      qb.andWhere(
        "(offer.travelPeriodStart IS NULL OR offer.travelPeriodStart <= :date)",
        { date },
      ).andWhere(
        "(offer.travelPeriodEnd IS NULL OR offer.travelPeriodEnd >= :date)",
        { date },
      );
    }

    return qb;
  }
}
