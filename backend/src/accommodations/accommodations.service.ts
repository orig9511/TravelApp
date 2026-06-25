import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Accommodation } from "./entities/accommodation.entity";
import { Reservation } from "../reservations/entities/reservation.entity";
import { CreateAccommodationDto } from "./dto/create-accommodation.dto";
import { FilterAccommodationDto } from "./dto/filter-accommodation.dto";
import { UserRole } from "../users/entities/user.entity";
import { Logger } from "@nestjs/common";

@Injectable()
export class AccommodationsService {
  private readonly logger = new Logger(AccommodationsService.name);
  constructor(
    @InjectRepository(Accommodation)
    private readonly accommodationRepository: Repository<Accommodation>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async findAll(
    filter: FilterAccommodationDto,
  ): Promise<{ data: Accommodation[]; total: number }> {
    const qb = this.accommodationRepository.createQueryBuilder("acc");

    // Filtering: city, type, pricing
    if (filter.city) {
      qb.andWhere("LOWER(acc.city) LIKE LOWER(:city)", {
        city: `%${filter.city}%`,
      });
    }
    if (filter.type) {
      qb.andWhere("LOWER(acc.type) = LOWER(:type)", { type: filter.type });
    }
    if (filter.minPrice !== undefined) {
      qb.andWhere("acc.pricePerNight >= :minPrice", {
        minPrice: filter.minPrice,
      });
    }
    if (filter.maxPrice !== undefined) {
      qb.andWhere("acc.pricePerNight <= :maxPrice", {
        maxPrice: filter.maxPrice,
      });
    }
    if (filter.minRating !== undefined) {
      qb.andWhere("acc.rating >= :minRating", { minRating: filter.minRating });
    }
    if (filter.minStars !== undefined) {
      qb.andWhere("acc.stars >= :minStars", { minStars: filter.minStars });
    }
    if (filter.services && filter.services.length > 0) {
      // JSON contains check for services array
      for (const service of filter.services) {
        qb.andWhere(`:service = ANY(acc.services)`, { service });
      }
    }

    // SQL-based availability check with date ranges
    // Instead of loading all accommodations then filtering in memory,
    // use SQL to check overlapping reservations
    if (filter.startDate && filter.endDate) {
      const start = new Date(filter.startDate);
      const end = new Date(filter.endDate);

      // Subquery: count overlapping reservations for each accommodation
      const subquery = this.reservationRepository
        .createQueryBuilder("r")
        .select("r.accommodationId", "accId")
        .addSelect("COUNT(*)", "overlappingCount")
        .where("r.startDate < :end AND r.endDate > :start", { start, end })
        .groupBy("r.accommodationId");

      // Main query: exclude accommodations where overlapping count >= room count
      qb.leftJoin(
        `(${subquery.getQuery()})`,
        "overlap",
        "overlap.accId = acc.id",
      ).andWhere(
        `COALESCE(overlap.overlappingCount, 0) < COALESCE(acc.roomCount, 1)`,
      );

      qb.setParameters(subquery.getParameters());
      qb.setParameter("start", start);
      qb.setParameter("end", end);

      // Optional: filter by persons capacity per room
      if (filter.persons) {
        const capacityPerAccommodation = filter.persons;
        qb.andWhere(
          `COALESCE(acc.capacityPerAccommodation, 2) >= :capacityPerAccommodation`,
          { capacityPerAccommodation },
        );
      }
    }

    // Pagination
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    // GUARD: Enforce hard limits to prevent DoS attacks
    const guardedLimit = Math.min(Math.max(limit, 1), 100); // Min 1, Max 100
    const guardedPage = Math.min(Math.max(page, 1), 1000000); // Min 1, Max 1M
    const skip = (guardedPage - 1) * guardedLimit;

    qb.orderBy("acc.createdAt", "DESC").skip(skip).take(guardedLimit);

    const [data, total] = await qb.getManyAndCount();

    this.logger.debug(
      `Searching accommodations: city=${filter.city}, page=${guardedPage}/${Math.ceil(total / guardedLimit)}, limit=${guardedLimit}`,
    );

    return { data, total };
  }

  async findOne(id: string): Promise<Accommodation> {
    const acc = await this.accommodationRepository.findOne({ where: { id } });
    if (!acc) throw new NotFoundException("Accommodation not found");
    return acc;
  }

  async create(
    dto: CreateAccommodationDto,
    userId: string,
  ): Promise<Accommodation> {
    const acc = this.accommodationRepository.create({ ...dto, userId });
    return this.accommodationRepository.save(acc);
  }

  async update(
    id: string,
    dto: Partial<CreateAccommodationDto>,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<Accommodation> {
    const acc = await this.accommodationRepository.findOne({ where: { id } });
    if (!acc) throw new NotFoundException("Accommodation not found");

    if (requesterRole !== UserRole.ADMIN && acc.userId !== requesterId) {
      throw new ForbiddenException(
        "Cannot update another user's accommodation",
      );
    }

    Object.assign(acc, dto);
    return this.accommodationRepository.save(acc);
  }

  async remove(
    id: string,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<void> {
    const acc = await this.accommodationRepository.findOne({ where: { id } });
    if (!acc) throw new NotFoundException("Accommodation not found");

    if (requesterRole !== UserRole.ADMIN && acc.userId !== requesterId) {
      throw new ForbiddenException(
        "Cannot delete another user's accommodation",
      );
    }

    await this.accommodationRepository.remove(acc);
  }

  async getTopByPrice(limit = 10): Promise<Accommodation[]> {
    return this.accommodationRepository.find({
      order: { pricePerNight: "ASC" },
      take: limit,
    });
  }

  async getCitySuggestions(searchTerm: string): Promise<string[]> {
    const accs = await this.accommodationRepository
      .createQueryBuilder("acc")
      .select("DISTINCT acc.city", "city")
      .where("acc.city ILIKE :term", { term: `%${searchTerm}%` })
      .limit(10)
      .getRawMany();
    return accs.map((a) => a.city).filter(Boolean);
  }
}
