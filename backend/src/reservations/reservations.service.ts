import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Reservation, ReservationStatus } from "./entities/reservation.entity";
import { Accommodation } from "../accommodations/entities/accommodation.entity";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { BookingEngineService } from "../booking-engine/booking-engine.service";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/entities/notification.entity";
import { Logger } from "@nestjs/common";

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Accommodation)
    private readonly bookingEngine: BookingEngineService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create accommodation reservation
   * Delegates to unified BookingEngineService to eliminate duplicated logic.
   * Booking engine handles:
   * - Transactional integrity with READ COMMITTED + pessimistic locking
   * - SQL-based availability checking (not in-memory)
   * - Centralized capacity validation
   * - Centralized price calculation
   */
  async create(
    userId: string,
    dto: CreateReservationDto,
  ): Promise<Reservation> {
    this.logger.log(
      `Creating reservation for user ${userId}: acc=${dto.accommodationId}, nights=${dto.startDate} to ${dto.endDate}`,
    );
    return this.bookingEngine.createAccommodationBooking(
      userId,
      dto.accommodationId,
      new Date(dto.startDate),
      new Date(dto.endDate),
      dto.persons ?? 1,
      dto.price,
    );
  }

  async findMyReservations(userId: string, pagination: PaginationDto) {
    const guardedPagination = new PaginationDto({
      page: pagination.page,
      limit: pagination.limit,
    });

    const [data, total] = await this.reservationRepository.findAndCount({
      where: { userId },
      relations: ["accommodation"],
      order: { createdAt: "DESC" },
      skip: guardedPagination.skip,
      take: guardedPagination.limit,
    });
    this.logger.debug(
      `Retrieved ${data.length} reservations for user ${userId}`,
    );
    return { data, total };
  }

  async findAll(pagination: PaginationDto) {
    const guardedPagination = new PaginationDto({
      page: pagination.page,
      limit: pagination.limit,
    });

    const [data, total] = await this.reservationRepository.findAndCount({
      relations: ["accommodation", "user"],
      order: { createdAt: "DESC" },
      skip: guardedPagination.skip,
      take: guardedPagination.limit,
    });
    this.logger.debug(`Retrieved ${data.length} total reservations`);
    return { data, total };
  }

  async remove(id: string, userId: string): Promise<void> {
    const res = await this.reservationRepository.findOne({ where: { id } });
    if (!res) throw new NotFoundException("Reservation not found");
    if (res.userId !== userId)
      throw new NotFoundException("Reservation not found");
    if (res.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        "Only pending reservations can be cancelled",
      );
    }
    res.status = ReservationStatus.CANCELLED;
    await this.reservationRepository.save(res);
    this.logger.log(
      `Reservation cancelled by user: id=${id}, userId=${userId}`,
    );

    try {
      await this.notificationsService.notifyUsers(
        [userId],
        NotificationType.BOOKING,
        "Szállásfoglalás törölve",
        "A szállásfoglalásod törölve lett.",
        id,
      );
    } catch (_) {
      /* non-blocking */
    }
  }

  async confirm(
    id: string,
    requesterId: string,
    isAdmin: boolean,
  ): Promise<Reservation> {
    const res = await this.reservationRepository.findOne({
      where: { id },
      relations: ["accommodation"],
    });
    if (!res) throw new NotFoundException("Reservation not found");

    if (!isAdmin) {
      const accommodation = res.accommodation;
      if (!accommodation || accommodation.userId !== requesterId) {
        throw new ForbiddenException(
          "Cannot confirm reservations you don't own",
        );
      }
    }

    if (res.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        "Only pending reservations can be confirmed",
      );
    }

    res.status = ReservationStatus.CONFIRMED;
    const saved = await this.reservationRepository.save(res);
    this.logger.log(
      `Reservation confirmed: id=${id}, requesterId=${requesterId}`,
    );

    try {
      const accName = res.accommodation?.name ?? "szállás";
      await this.notificationsService.notifyUsers(
        [saved.userId],
        NotificationType.BOOKING,
        "Szállásfoglalás visszaigazolva",
        `A foglalásod (${accName}) visszaigazolásra került.`,
        id,
      );
    } catch (_) {
      /* non-blocking */
    }

    return saved;
  }

  async adminCancel(id: string): Promise<Reservation> {
    const res = await this.reservationRepository.findOne({
      where: { id },
      relations: ["accommodation"],
    });
    if (!res) throw new NotFoundException("Reservation not found");

    if (res.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException("Reservation is already cancelled");
    }

    res.status = ReservationStatus.CANCELLED;
    const saved = await this.reservationRepository.save(res);
    this.logger.log(`Reservation admin-cancelled: id=${id}`);

    try {
      const accName = res.accommodation?.name ?? "szállás";
      await this.notificationsService.notifyUsers(
        [saved.userId],
        NotificationType.BOOKING,
        "Szállásfoglalás visszautasítva",
        `A foglalásod (${accName}) visszautasításra került.`,
        id,
      );
    } catch (_) {
      /* non-blocking */
    }

    return saved;
  }
}
