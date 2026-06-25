import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Booking, BookingStatus } from "./entities/booking.entity";
import { BookingEngineService } from "../booking-engine/booking-engine.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { UserRole } from "../users/entities/user.entity";
import { Logger } from "@nestjs/common";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/entities/notification.entity";

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly bookingEngine: BookingEngineService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateBookingDto): Promise<Booking> {
    return this.bookingEngine.createBooking(userId, dto);
  }

  async findMyBookings(
    userId: string,
    pagination: PaginationDto,
  ): Promise<{ data: Booking[]; total: number }> {
    // GUARD: Enforce pagination limits
    const guardedPagination = new PaginationDto({
      page: pagination.page,
      limit: pagination.limit,
    });

    const [data, total] = await this.bookingRepository.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: guardedPagination.skip,
      take: guardedPagination.limit,
      relations: ["offer", "offerInstance"],
    });
    this.logger.debug(
      `Retrieved ${data.length} bookings for user ${userId}, total: ${total}`,
    );
    return { data, total };
  }

  async findAll(
    pagination: PaginationDto,
    status?: BookingStatus,
    advertiserId?: string,
  ): Promise<{ data: Booking[]; total: number }> {
    // GUARD: Enforce pagination limits
    const guardedPagination = new PaginationDto({
      page: pagination.page,
      limit: pagination.limit,
    });

    const qb = this.bookingRepository
      .createQueryBuilder("booking")
      .leftJoinAndSelect("booking.offer", "offer")
      .leftJoinAndSelect("booking.offerInstance", "offerInstance")
      .leftJoinAndSelect("booking.user", "user")
      .orderBy("booking.createdAt", "DESC")
      .skip(guardedPagination.skip)
      .take(guardedPagination.limit);

    if (status) {
      qb.andWhere("booking.status = :status", { status });
    }

    if (advertiserId) {
      qb.andWhere("offer.createdBy = :advertiserId", { advertiserId });
    }

    const [data, total] = await qb.getManyAndCount();
    this.logger.debug(
      `Retrieved ${data.length} bookings, total: ${total}, status: ${status}, advertiser: ${advertiserId}`,
    );
    return { data, total };
  }

  async findOne(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ["offer", "offerInstance", "user"],
    });

    if (!booking) throw new NotFoundException("Booking not found");

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.ADVERTISER &&
      booking.userId !== userId
    ) {
      throw new ForbiddenException("Cannot access this booking");
    }

    return booking;
  }

  async confirmBooking(
    id: string,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ["offer"],
    });

    if (!booking) throw new NotFoundException("Booking not found");

    if (
      requesterRole !== UserRole.ADMIN &&
      booking.offer?.createdBy !== requesterId
    ) {
      throw new ForbiddenException(
        "Cannot confirm bookings for offers you don't own",
      );
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException("Only pending bookings can be confirmed");
    }

    booking.status = BookingStatus.CONFIRMED;
    const saved = await this.bookingRepository.save(booking);
    this.logger.log(
      `Booking confirmed: id=${saved.id}, requesterId=${requesterId}, requesterRole=${requesterRole}`,
    );

    try {
      await this.notificationsService.notifyUsers(
        [saved.userId],
        NotificationType.BOOKING,
        "Foglalás visszaigazolva",
        `A(z) "${saved.offerTitle ?? "Ajánlat"}" foglalásod visszaigazolásra került.`,
        saved.id,
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to send confirmation notification: ${err?.message}`,
      );
    }

    return saved;
  }

  async cancelByUser(id: string, userId: string): Promise<Booking> {
    return this.bookingEngine.cancelBooking(id, userId, false);
  }

  async cancelByAdmin(id: string, adminId: string): Promise<Booking> {
    return this.bookingEngine.cancelBooking(id, adminId, true);
  }

  async getOfferStats(offerId: string): Promise<any> {
    const bookings = await this.bookingRepository.find({
      where: { offerId },
    });

    const stats = {
      total: bookings.length,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      totalRevenue: 0,
      confirmedRevenue: 0,
    };

    for (const b of bookings) {
      if (b.status === BookingStatus.PENDING) stats.pending++;
      else if (b.status === BookingStatus.CONFIRMED) {
        stats.confirmed++;
        stats.confirmedRevenue += Number(b.totalPrice);
      } else if (b.status === BookingStatus.CANCELLED) {
        stats.cancelled++;
      }
      stats.totalRevenue += Number(b.totalPrice);
    }

    this.logger.debug(
      `Calculated stats for offer ${offerId}: ${JSON.stringify(stats)}`,
    );
    return stats;
  }
}
