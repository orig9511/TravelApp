import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ConflictException } from "../common/exceptions/conflict.exception";
import {
  Booking,
  BookingStatus,
  BookingType,
} from "../bookings/entities/booking.entity";
import { OfferInstance } from "../offer-instances/entities/offer-instance.entity";
import { Offer } from "../offers/entities/offer.entity";
import { User } from "../users/entities/user.entity";
import { CreateBookingDto } from "../bookings/dto/create-booking.dto";
import {
  Reservation,
  ReservationStatus,
} from "../reservations/entities/reservation.entity";
import { Accommodation } from "../accommodations/entities/accommodation.entity";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/entities/notification.entity";

const EXTRA_BAGGAGE_PRICE = 50;
const EXTRA_LEGROOM_PRICE = 30;

@Injectable()
export class BookingEngineService {
  private readonly logger = new Logger(BookingEngineService.name);
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 100;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(OfferInstance)
    private readonly instanceRepository: Repository<OfferInstance>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Accommodation)
    private readonly accommodationRepository: Repository<Accommodation>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createBooking(userId: string, dto: CreateBookingDto): Promise<Booking> {
    if (dto.passengers && dto.passengers.length > 0) {
      if (dto.passengers.length !== dto.quantity) {
        throw new BadRequestException(
          `Passengers count (${dto.passengers.length}) must match quantity (${dto.quantity})`,
        );
      }
    }

    if (dto.idempotencyKey) {
      const existingBooking = await this.bookingRepository.findOne({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existingBooking) {
        this.logger.warn(
          `Idempotent booking found: key=${dto.idempotencyKey}, booking=${existingBooking.id}`,
        );
        return existingBooking;
      }
    }

    return this.createBookingWithRetry(userId, dto, 0);
  }

  private async createBookingWithRetry(
    userId: string,
    dto: CreateBookingDto,
    attempt: number,
  ): Promise<Booking> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction("READ COMMITTED");

      try {
        const user = await queryRunner.manager.findOne(User, {
          where: { id: userId },
        });
        if (!user) {
          throw new NotFoundException("User not found");
        }

        const instance = await queryRunner.manager.findOne(OfferInstance, {
          where: { id: dto.offerInstanceId },
          lock: { mode: "pessimistic_write" },
        });

        if (!instance) {
          throw new NotFoundException("Offer instance not found");
        }

        if (instance.offerId !== dto.offerId) {
          throw new BadRequestException("Offer instance does not match offer");
        }

        const offer = await queryRunner.manager.findOne(Offer, {
          where: { id: dto.offerId },
          lock: { mode: "pessimistic_write" },
        });

        if (!offer) {
          throw new NotFoundException("Offer not found");
        }
        if (offer.isInactive) {
          throw new BadRequestException("Offer is currently inactive");
        }
        if (offer.notShowable) {
          throw new BadRequestException("Offer is not available");
        }

        this.validateOfferCapacity(instance, dto);

        await queryRunner.manager.decrement(
          OfferInstance,
          { id: instance.id },
          "availableCapacity",
          dto.quantity,
        );

        if (dto.extras?.extraBaggage && dto.extras.extraBaggage > 0) {
          const updated = { ...instance.extrasCapacity };
          updated.extraBaggage =
            (updated.extraBaggage ?? 0) - dto.extras.extraBaggage;
          await queryRunner.manager.update(OfferInstance, instance.id, {
            extrasCapacity: updated,
          });
        }

        if (dto.extras?.extraLegroom && dto.extras.extraLegroom > 0) {
          const updated = { ...instance.extrasCapacity };
          updated.extraLegroom =
            (updated.extraLegroom ?? 0) - dto.extras.extraLegroom;
          await queryRunner.manager.update(OfferInstance, instance.id, {
            extrasCapacity: updated,
          });
        }

        const totalPrice = this.calculateTotal(
          Number(instance.pricePerPerson),
          dto.quantity,
          dto.extras,
        );

        const booking = queryRunner.manager.create(Booking, {
          bookingType: dto.bookingType ?? BookingType.OFFER,
          offerId: dto.offerId,
          offerInstanceId: dto.offerInstanceId,
          userId,
          idempotencyKey: dto.idempotencyKey || null,
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          offerTitle: offer.title,
          selectedDate: instance.departureDate,
          quantity: dto.quantity,
          pricePerPerson: Number(instance.pricePerPerson),
          totalPrice,
          status: BookingStatus.PENDING,
          passengers: dto.passengers ?? [],
          extras: dto.extras ?? null,
        });

        const saved = await queryRunner.manager.save(Booking, booking);
        await queryRunner.commitTransaction();
        this.logger.log(
          `Booking created: id=${saved.id}, userId=${userId}, quantity=${dto.quantity}`,
        );
        return saved;
      } catch (err) {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        throw err;
      } finally {
        await queryRunner.release();
      }
    } catch (err) {
      const error = this.toError(err);
      const isLockError = this.isLockError(error);

      if (isLockError && attempt < this.MAX_RETRY_ATTEMPTS) {
        const delayMs = this.RETRY_DELAY_MS * Math.pow(2, attempt);
        this.logger.warn(
          `Lock conflict on booking attempt ${attempt + 1}/${this.MAX_RETRY_ATTEMPTS}, retrying in ${delayMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.createBookingWithRetry(userId, dto, attempt + 1);
      }

      if (isLockError) {
        this.logger.error(
          `Lock conflict after ${this.MAX_RETRY_ATTEMPTS} retries: ${error.message}`,
        );
        throw new ConflictException(
          "Booking not available due to high demand. Please try again.",
        );
      }

      if (
        err instanceof BadRequestException &&
        error.message.includes("available")
      ) {
        this.logger.warn(`Capacity exhausted: ${error.message}`);
        throw new ConflictException(error.message);
      }

      this.logger.error(`Booking creation failed: ${error.message}`);
      throw err;
    }
  }

  async createAccommodationBooking(
    userId: string,
    accommodationId: string,
    startDate: Date,
    endDate: Date,
    persons: number = 1,
    price?: number,
  ): Promise<Reservation> {
    if (endDate <= startDate) {
      throw new BadRequestException("End date must be after start date");
    }

    const daysDiff =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      throw new BadRequestException(
        "Reservation period cannot exceed 365 days",
      );
    }
    if (daysDiff < 1) {
      throw new BadRequestException("Minimum stay is 1 day");
    }

    return this.createAccommodationBookingWithRetry(
      userId,
      accommodationId,
      startDate,
      endDate,
      persons,
      price,
      0,
    );
  }

  private async createAccommodationBookingWithRetry(
    userId: string,
    accommodationId: string,
    startDate: Date,
    endDate: Date,
    persons: number,
    price: number | undefined,
    attempt: number,
  ): Promise<Reservation> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction("READ COMMITTED");

      try {
        const accommodation = await queryRunner.manager.findOne(Accommodation, {
          where: { id: accommodationId },
          lock: { mode: "pessimistic_write" },
        });
        if (!accommodation) {
          throw new NotFoundException("Accommodation not found");
        }

        const overlapping = await queryRunner.manager
          .createQueryBuilder(Reservation, "reservation")
          .where("reservation.accommodationId = :accommodationId", {
            accommodationId,
          })
          .andWhere(
            "reservation.startDate < :endDate AND reservation.endDate > :startDate",
            { startDate, endDate },
          )
          .getCount();

        const roomCount = accommodation.roomCount ?? 1;
        if (overlapping >= roomCount) {
          this.logger.warn(
            `Accommodation double-booking prevented: accId=${accommodationId}, overlap=${overlapping}, rooms=${roomCount}`,
          );
          throw new ConflictException(
            "No rooms available for the selected dates",
          );
        }

        const nights = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const calculatedPrice =
          price ?? Number(accommodation.pricePerNight ?? 0) * nights * persons;

        const reservation = queryRunner.manager.create(Reservation, {
          accommodationId,
          userId,
          startDate,
          endDate,
          price: calculatedPrice,
          persons,
          status: ReservationStatus.PENDING,
        });

        const saved = await queryRunner.manager.save(Reservation, reservation);
        await queryRunner.commitTransaction();
        this.logger.log(
          `Accommodation reservation created: id=${saved.id}, userId=${userId}, accId=${accommodationId}`,
        );

        try {
          await this.notificationsService.notifyUsers(
            [userId],
            NotificationType.BOOKING,
            "Szállásfoglalás fogadva",
            `A foglalásod (${accommodation.name}) megérkezett és jóváhagyásra vár.`,
            saved.id,
          );
        } catch (_) {
          /* non-blocking */
        }

        return saved;
      } catch (err) {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        throw err;
      } finally {
        await queryRunner.release();
      }
    } catch (err) {
      const error = this.toError(err);
      const isLockError = this.isLockError(error);

      if (isLockError && attempt < this.MAX_RETRY_ATTEMPTS) {
        const delayMs = this.RETRY_DELAY_MS * Math.pow(2, attempt);
        this.logger.warn(
          `Lock conflict on accommodation reservation attempt ${attempt + 1}/${this.MAX_RETRY_ATTEMPTS}, retrying in ${delayMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.createAccommodationBookingWithRetry(
          userId,
          accommodationId,
          startDate,
          endDate,
          persons,
          price,
          attempt + 1,
        );
      }

      if (isLockError) {
        this.logger.error(
          `Lock conflict on accommodation after ${this.MAX_RETRY_ATTEMPTS} retries: ${error.message}`,
        );
        throw new ConflictException(
          "Reservation not available due to high demand. Please try again.",
        );
      }

      this.logger.error(`Accommodation booking failed: ${error.message}`);
      throw err;
    }
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    isAdmin = false,
  ): Promise<Booking> {
    return this.cancelBookingWithRetry(bookingId, userId, isAdmin, 0);
  }

  private async cancelBookingWithRetry(
    bookingId: string,
    userId: string,
    isAdmin: boolean,
    attempt: number,
  ): Promise<Booking> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction("READ COMMITTED");

      try {
        const booking = await queryRunner.manager.findOne(Booking, {
          where: { id: bookingId },
          lock: { mode: "pessimistic_write" },
        });

        if (!booking) {
          throw new NotFoundException("Booking not found");
        }

        if (!isAdmin && booking.userId !== userId) {
          throw new ForbiddenException("Cannot cancel another user's booking");
        }

        if (!isAdmin && booking.status !== BookingStatus.PENDING) {
          throw new BadRequestException(
            "Only pending bookings can be cancelled by the user",
          );
        }

        if (booking.status === BookingStatus.CANCELLED) {
          throw new BadRequestException("Booking is already cancelled");
        }

        if (booking.offerInstanceId) {
          await queryRunner.manager.increment(
            OfferInstance,
            { id: booking.offerInstanceId },
            "availableCapacity",
            booking.quantity,
          );

          if (booking.extras?.extraBaggage && booking.extras.extraBaggage > 0) {
            const instance = await queryRunner.manager.findOne(OfferInstance, {
              where: { id: booking.offerInstanceId },
              lock: { mode: "pessimistic_write" },
            });
            if (instance) {
              const updated = { ...instance.extrasCapacity };
              updated.extraBaggage =
                (updated.extraBaggage ?? 0) + booking.extras.extraBaggage;
              await queryRunner.manager.update(OfferInstance, instance.id, {
                extrasCapacity: updated,
              });
            }
          }

          if (booking.extras?.extraLegroom && booking.extras.extraLegroom > 0) {
            const instance = await queryRunner.manager.findOne(OfferInstance, {
              where: { id: booking.offerInstanceId },
              lock: { mode: "pessimistic_write" },
            });
            if (instance) {
              const updated = { ...instance.extrasCapacity };
              updated.extraLegroom =
                (updated.extraLegroom ?? 0) + booking.extras.extraLegroom;
              await queryRunner.manager.update(OfferInstance, instance.id, {
                extrasCapacity: updated,
              });
            }
          }
        }

        booking.status = BookingStatus.CANCELLED;
        const saved = await queryRunner.manager.save(Booking, booking);
        await queryRunner.commitTransaction();
        this.logger.log(
          `Booking cancelled: id=${saved.id}, userId=${userId}, isAdmin=${isAdmin}`,
        );

        try {
          await this.notificationsService.notifyUsers(
            [saved.userId],
            NotificationType.BOOKING,
            "Foglalás visszautasítva",
            `A(z) "${saved.offerTitle ?? "Ajánlat"}" foglalásod visszautasításra került.`,
            saved.id,
          );
        } catch (err: any) {
          this.logger.error(
            `Failed to send cancellation notification: ${err?.message}`,
          );
        }

        return saved;
      } catch (err) {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        throw err;
      } finally {
        await queryRunner.release();
      }
    } catch (err) {
      const error = this.toError(err);
      const isLockError = this.isLockError(error);

      if (isLockError && attempt < this.MAX_RETRY_ATTEMPTS) {
        const delayMs = this.RETRY_DELAY_MS * Math.pow(2, attempt);
        this.logger.warn(
          `Lock conflict on cancellation attempt ${attempt + 1}/${this.MAX_RETRY_ATTEMPTS}, retrying in ${delayMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.cancelBookingWithRetry(
          bookingId,
          userId,
          isAdmin,
          attempt + 1,
        );
      }

      if (isLockError) {
        this.logger.error(
          `Lock conflict on cancellation after ${this.MAX_RETRY_ATTEMPTS} retries: ${error.message}`,
        );
        throw new ConflictException(
          "Cannot cancel booking due to high demand. Please try again.",
        );
      }

      this.logger.error(`Booking cancellation failed: ${error.message}`);
      throw err;
    }
  }

  private validateOfferCapacity(
    instance: OfferInstance,
    dto: CreateBookingDto,
  ): void {
    if (instance.availableCapacity < dto.quantity) {
      throw new BadRequestException(
        `Only ${instance.availableCapacity} seats available, requested ${dto.quantity}`,
      );
    }

    if (dto.extras?.extraBaggage && dto.extras.extraBaggage > 0) {
      if (!instance.extrasAvailable?.extraBaggage) {
        throw new BadRequestException(
          "Extra baggage is not available for this instance",
        );
      }
      const extrasCapacity = instance.extrasCapacity?.extraBaggage ?? 0;
      if (dto.extras.extraBaggage > extrasCapacity) {
        throw new BadRequestException(
          `Only ${extrasCapacity} extra baggage slots available`,
        );
      }
    }

    if (dto.extras?.extraLegroom && dto.extras.extraLegroom > 0) {
      if (!instance.extrasAvailable?.extraLegroom) {
        throw new BadRequestException(
          "Extra legroom is not available for this instance",
        );
      }
      const extrasCapacity = instance.extrasCapacity?.extraLegroom ?? 0;
      if (dto.extras.extraLegroom > extrasCapacity) {
        throw new BadRequestException(
          `Only ${extrasCapacity} extra legroom slots available`,
        );
      }
    }
  }

  private calculateTotal(
    pricePerPerson: number,
    quantity: number,
    extras?: { extraBaggage?: number; extraLegroom?: number } | null,
  ): number {
    let total = pricePerPerson * quantity;
    if (extras?.extraBaggage) {
      total += extras.extraBaggage * EXTRA_BAGGAGE_PRICE;
    }
    if (extras?.extraLegroom) {
      total += extras.extraLegroom * EXTRA_LEGROOM_PRICE;
    }
    return Number(total.toFixed(2));
  }

  private isLockError(error: { code?: string; message: string }): boolean {
    return (
      error.code === "40P01" ||
      error.code === "ER_LOCK_WAIT_TIMEOUT" ||
      error.message.includes("NOWAIT")
    );
  }

  private toError(err: unknown): { code?: string; message: string } {
    if (typeof err === "object" && err !== null) {
      const maybeError = err as { code?: string; message?: string };
      return {
        code: maybeError.code,
        message: maybeError.message ?? "Unknown error",
      };
    }

    return {
      message: typeof err === "string" ? err : "Unknown error",
    };
  }
}
