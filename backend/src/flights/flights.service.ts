import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, Repository, SelectQueryBuilder } from "typeorm";
import { Flight } from "./entities/flight.entity";
import { CreateFlightDto } from "./dto/create-flight.dto";
import { FilterFlightsDto } from "./dto/filter-flights.dto";
import { CreateFlightBookingDto } from "./dto/create-flight-booking.dto";
import {
  Booking,
  BookingType,
  BookingStatus,
} from "../bookings/entities/booking.entity";
import { User } from "../users/entities/user.entity";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/entities/notification.entity";

@Injectable()
export class FlightsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Flight)
    private readonly flightRepository: Repository<Flight>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(
    filter: FilterFlightsDto,
  ): Promise<{ data: Flight[]; total: number }> {
    const qb = this.buildQuery(filter);
    const [data, total] = await qb
      .skip(filter.skip)
      .take(filter.limit)
      .getManyAndCount();
    return { data, total };
  }

  async findAllWithFallback(filter: FilterFlightsDto): Promise<{
    data: Flight[];
    total: number;
    searchLevel: 0 | 1 | 2;
    dateRangeApplied?: { from: string; to: string };
  }> {
    const exact = await this.findAll(filter);
    if (exact.total > 0 || !filter.departDate) {
      return { ...exact, searchLevel: 0 };
    }

    // Level 1: ±3 day window
    const [y, m, d] = filter.departDate.split("-").map(Number);
    const fromDate = new Date(Date.UTC(y, m - 1, d - 3));
    const toDate = new Date(Date.UTC(y, m - 1, d + 3));
    const fromStr = fromDate.toISOString().split("T")[0];
    const toStr = toDate.toISOString().split("T")[0];

    const windowQb = this.buildQuery({
      ...filter,
      departDate: undefined,
      departDateFrom: fromStr,
      departDateTo: toStr,
    } as FilterFlightsDto);
    const [windowData, windowTotal] = await windowQb
      .skip(filter.skip)
      .take(filter.limit)
      .getManyAndCount();

    if (windowTotal > 0) {
      return {
        data: windowData,
        total: windowTotal,
        searchLevel: 1,
        dateRangeApplied: { from: fromStr, to: toStr },
      };
    }

    // Level 2: no route match — return discovery flights
    const discovery = await this.getDiscoveryFlights(6);
    return { data: discovery, total: discovery.length, searchLevel: 2 };
  }

  async getDiscoveryFlights(limit = 12): Promise<Flight[]> {
    const today = new Date().toISOString().split("T")[0];

    // DISTINCT ON: one cheapest flight per unique (from_code, to_code) route
    const rows: { id: string }[] = await this.dataSource.query(
      `SELECT DISTINCT ON (from_code, to_code) id
       FROM flights
       WHERE depart_date >= $1
         AND available_seats > 0
       ORDER BY from_code, to_code, price ASC`,
      [today],
    );

    if (!rows.length) return [];

    // Shuffle for variety across page loads
    const ids = rows.map((r) => r.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const selectedIds = ids.slice(0, limit);

    const flights = await this.flightRepository
      .createQueryBuilder("flight")
      .where("flight.id IN (:...ids)", { ids: selectedIds })
      .getMany();

    const byId = new Map(flights.map((f) => [f.id, f]));
    return selectedIds
      .map((id) => byId.get(id))
      .filter((f): f is Flight => !!f);
  }

  async getCheapestPerDestination(): Promise<Flight[]> {
    // One cheapest flight per destination (to_code) — used by package service
    const rows: { id: string }[] = await this.dataSource.query(
      `SELECT DISTINCT ON (to_code) id
       FROM flights
       WHERE available_seats > 0
       ORDER BY to_code, price ASC`,
    );

    if (!rows.length) return [];

    const ids = rows.map((r) => r.id);
    return this.flightRepository
      .createQueryBuilder("flight")
      .where("flight.id IN (:...ids)", { ids })
      .getMany();
  }

  async searchAirports(q: string): Promise<{ code: string; label: string }[]> {
    if (!q || q.trim().length < 1) return [];
    const term = q.trim().toLowerCase();
    const rows: { code: string; label: string }[] = await this.dataSource.query(
      `SELECT DISTINCT code, label,
        GREATEST(
          word_similarity($1, LOWER(label)),
          CASE WHEN LOWER(code) LIKE $2 THEN 1.0 ELSE 0.0 END
        ) AS sim
       FROM (
         SELECT DISTINCT from_code AS code, COALESCE(from_label, from_code) AS label
           FROM flights WHERE from_code IS NOT NULL
         UNION
         SELECT DISTINCT to_code AS code, COALESCE(to_label, to_code) AS label
           FROM flights WHERE to_code IS NOT NULL
       ) sub
       WHERE LOWER(code) LIKE $2
          OR LOWER(label) LIKE $3
          OR word_similarity($1, LOWER(label)) > 0.15
       ORDER BY sim DESC
       LIMIT 10`,
      [term, `${term}%`, `%${term}%`],
    );
    return rows
      .filter((r) => !!r.code)
      .map((r) => ({ code: r.code, label: r.label }));
  }

  async findOne(id: string): Promise<Flight> {
    const flight = await this.flightRepository.findOne({ where: { id } });
    if (!flight) throw new NotFoundException("Flight not found");
    return flight;
  }

  async create(dto: CreateFlightDto): Promise<Flight> {
    const flight = this.flightRepository.create({
      ...dto,
      departDate: dto.departDate ? new Date(dto.departDate) : undefined,
    });
    return this.flightRepository.save(flight);
  }

  async remove(id: string): Promise<void> {
    const flight = await this.flightRepository.findOne({ where: { id } });
    if (!flight) throw new NotFoundException("Flight not found");
    await this.flightRepository.remove(flight);
  }

  async createFlightBooking(
    userId: string,
    dto: CreateFlightBookingDto,
  ): Promise<Booking> {
    if (dto.returnFlightId && dto.returnFlightId === dto.outboundFlightId) {
      throw new BadRequestException(
        "Outbound and return flights must be different",
      );
    }

    const existing = dto.idempotencyKey
      ? await this.bookingRepository.findOne({
          where: { idempotencyKey: dto.idempotencyKey },
        })
      : null;

    if (existing) {
      return existing;
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException("User not found");
      }

      const outbound = await manager.findOne(Flight, {
        where: { id: dto.outboundFlightId },
      });
      if (!outbound) {
        throw new NotFoundException("Outbound flight not found");
      }

      let ret: Flight | null = null;
      if (dto.returnFlightId) {
        ret = await manager.findOne(Flight, {
          where: { id: dto.returnFlightId },
        });
        if (!ret) {
          throw new NotFoundException("Return flight not found");
        }
        // Validate round-trip route consistency
        if (outbound.toCode !== ret.fromCode) {
          throw new BadRequestException(
            "Return flight must depart from the outbound destination",
          );
        }
      }

      // Atomic seat decrement: UPDATE ... WHERE available_seats >= qty RETURNING id
      // This eliminates the race condition of check-then-decrement.
      const outboundUpdated: { id: string }[] = await manager.query(
        `UPDATE flights
         SET available_seats = available_seats - $1
         WHERE id = $2 AND available_seats >= $1
         RETURNING id`,
        [dto.quantity, outbound.id],
      );
      if (!outboundUpdated.length) {
        throw new BadRequestException("Not enough seats on outbound flight");
      }

      if (ret) {
        const returnUpdated: { id: string }[] = await manager.query(
          `UPDATE flights
           SET available_seats = available_seats - $1
           WHERE id = $2 AND available_seats >= $1
           RETURNING id`,
          [dto.quantity, ret.id],
        );
        if (!returnUpdated.length) {
          // Rollback the outbound decrement we already applied
          await manager.query(
            `UPDATE flights SET available_seats = available_seats + $1 WHERE id = $2`,
            [dto.quantity, outbound.id],
          );
          throw new BadRequestException("Not enough seats on return flight");
        }
      }

      const checked = dto.baggage?.checked ?? 0;
      const priority = dto.baggage?.priority ?? 0;
      const extraBaggagePrice = checked * 25;
      const extraLegroomPrice = priority * 45;

      const pricePerPerson =
        Number(outbound.price) + (ret ? Number(ret.price) : 0);
      const totalPrice =
        pricePerPerson * dto.quantity + extraBaggagePrice + extraLegroomPrice;

      const fullName = dto.contact
        ? `${dto.contact.lastName} ${dto.contact.firstName}`.trim()
        : `${user.lastName} ${user.firstName}`.trim();

      const routeLabel = ret
        ? `${outbound.fromCode}-${outbound.toCode} / ${ret.fromCode}-${ret.toCode}`
        : `${outbound.fromCode}-${outbound.toCode}`;

      const booking = manager.create(Booking, {
        bookingType: BookingType.FLIGHT,
        offerId: null,
        offerInstanceId: null,
        userId,
        userEmail: dto.contact?.email || user.email,
        userName: fullName,
        offerTitle: `${outbound.airline}: ${routeLabel}`,
        selectedDate: outbound.departDate,
        quantity: dto.quantity,
        idempotencyKey: dto.idempotencyKey || null,
        pricePerPerson,
        totalPrice,
        status: BookingStatus.PENDING,
        passengers: dto.contact
          ? [
              {
                fullName,
                phoneNumber: dto.contact.phone,
              },
            ]
          : [],
        extras: {
          extraBaggage: checked,
          extraLegroom: priority,
        },
      });

      const saved = await manager.save(Booking, booking);

      try {
        await this.notificationsService.notifyUsers(
          [userId],
          NotificationType.BOOKING,
          "Repülőjegy foglalás fogadva",
          `A(z) "${saved.offerTitle}" foglalásod megérkezett és jóváhagyásra vár.`,
          saved.id,
        );
      } catch (_) {
        /* non-blocking */
      }

      return saved;
    });
  }

  private buildQuery(filter: FilterFlightsDto): SelectQueryBuilder<Flight> {
    const qb = this.flightRepository.createQueryBuilder("flight");

    if (filter.fromCode) {
      qb.andWhere("flight.fromCode = :fromCode", {
        fromCode: filter.fromCode.toUpperCase(),
      });
    }
    if (filter.toCode) {
      qb.andWhere("flight.toCode = :toCode", {
        toCode: filter.toCode.toUpperCase(),
      });
    }
    if (filter.departDateFrom && filter.departDateTo) {
      qb.andWhere(
        "flight.departDate BETWEEN :departDateFrom AND :departDateTo",
        {
          departDateFrom: filter.departDateFrom,
          departDateTo: filter.departDateTo,
        },
      );
    } else if (filter.departDate) {
      qb.andWhere("flight.departDate = :departDate", {
        departDate: filter.departDate,
      });
    }
    if (filter.minPrice !== undefined) {
      qb.andWhere("flight.price >= :minPrice", { minPrice: filter.minPrice });
    }
    if (filter.maxPrice !== undefined) {
      qb.andWhere("flight.price <= :maxPrice", { maxPrice: filter.maxPrice });
    }
    if (filter.maxStops !== undefined) {
      qb.andWhere("flight.stopsCount <= :maxStops", {
        maxStops: filter.maxStops,
      });
    }
    if (filter.minDuration !== undefined) {
      qb.andWhere("flight.durationMinutes >= :minDuration", {
        minDuration: filter.minDuration,
      });
    }
    if (filter.maxDuration !== undefined) {
      qb.andWhere("flight.durationMinutes <= :maxDuration", {
        maxDuration: filter.maxDuration,
      });
    }
    if (filter.minAvailableSeats !== undefined) {
      qb.andWhere("flight.availableSeats >= :minAvailableSeats", {
        minAvailableSeats: filter.minAvailableSeats,
      });
    }
    if (filter.airline) {
      // Exact case-insensitive match — prevents substring false-positives
      qb.andWhere("UPPER(flight.airline) = UPPER(:airline)", {
        airline: filter.airline.trim(),
      });
    }
    if (filter.isRefundable !== undefined) {
      qb.andWhere("flight.isRefundable = :isRefundable", {
        isRefundable: filter.isRefundable,
      });
    }
    if (filter.hasBaggage !== undefined) {
      qb.andWhere("flight.hasBaggage = :hasBaggage", {
        hasBaggage: filter.hasBaggage,
      });
    }

    // Primary sort + deterministic tiebreaker
    if (filter.sortBy === "duration") {
      qb.orderBy("flight.durationMinutes", "ASC").addOrderBy(
        "flight.price",
        "ASC",
      );
    } else if (filter.sortBy === "departTime") {
      qb.orderBy("flight.departAt", "ASC").addOrderBy("flight.price", "ASC");
    } else if (filter.sortBy === "arrivalTime") {
      qb.orderBy("flight.arriveAt", "ASC").addOrderBy("flight.price", "ASC");
    } else {
      // Default: cheapest first, then earliest departure as tiebreaker
      qb.orderBy("flight.price", "ASC").addOrderBy("flight.departAt", "ASC");
    }

    return qb;
  }
}
