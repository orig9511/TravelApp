import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { IsoDatePipe } from "../../../shared/pipes/iso-date.pipe";
import { OrderDetailsModalComponent } from "./order-details-modal/order-details-modal.component";
import { combineLatest, forkJoin, Subject, Observable, of } from "rxjs";
import { map, takeUntil } from "rxjs/operators";

import { Booking, BookingStatus } from "../../../models/booking.model";
import { Reservation } from "../../../models/reservation.model";
import { Offer } from "../../../models/offer.model";
import { OfferInstance } from "../../../models/offer-instance.model";
import { AppUserProfile } from "../../../models/user.model";
import { BookingService } from "../../../services/booking.service";
import { OfferService } from "../../../services/offer.service";
import { OfferInstanceService } from "../../../services/offer-instance.service";
import { AuthService } from "../../../services/auth.service";
import { ApiService } from "../../../core/api.service";
import { NotificationService } from "../../../services/notification.service";
import { ReservationService } from "../../../services/reservation.service";
import { ToastService } from "../../../services/toast.service";

export interface EnrichedBooking extends Booking {
  offer?: Offer;
  instance?: OfferInstance;
  user?: AppUserProfile;
}

export interface BookingsByStatus {
  pending: EnrichedBooking[];
  confirmed: EnrichedBooking[];
  cancelled: EnrichedBooking[];
}

@Component({
  selector: "app-manage-orders",
  templateUrl: "./manage-orders.component.html",
  styleUrls: ["./manage-orders.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IsoDatePipe,
    OrderDetailsModalComponent,
  ],
})
export class ManageOrdersComponent implements OnInit, OnDestroy {
  bookingsByStatus: BookingsByStatus = {
    pending: [],
    confirmed: [],
    cancelled: [],
  };

  reservationsByStatus: {
    pending: Reservation[];
    confirmed: Reservation[];
    cancelled: Reservation[];
  } = {
    pending: [],
    confirmed: [],
    cancelled: [],
  };

  loading = true;
  error: string | null = null;
  processingBookingId: string | null = null;
  processingReservationId: string | null = null;

  confirmingBookingAction: { id: string; action: "confirm" | "reject" } | null =
    null;
  confirmingReservationAction: {
    id: string;
    action: "confirm" | "reject";
  } | null = null;

  // Modal state
  showModal = false;
  selectedBooking: EnrichedBooking | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private bookingService: BookingService,
    private offerService: OfferService,
    private offerInstanceService: OfferInstanceService,
    private authService: AuthService,
    private apiService: ApiService,
    private notificationService: NotificationService,
    private reservationService: ReservationService,
    private toastService: ToastService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      reservations: this.reservationService.getAllReservations(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ reservations }) => {
          const sortByDate = (a: Reservation, b: Reservation) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime();
          this.reservationsByStatus = {
            pending: reservations
              .filter((r) => r.status === "pending")
              .sort(sortByDate),
            confirmed: reservations
              .filter((r) => r.status === "confirmed")
              .sort(sortByDate),
            cancelled: reservations
              .filter((r) => r.status === "cancelled")
              .sort(sortByDate),
          };
        },
        error: () => {
          this.error = this.translate.instant("manageOrders.loadError");
        },
      });

    this.loadAllBookings();
  }

  loadAllBookings(): void {
    this.loading = true;
    this.error = null;

    this.bookingService
      .getAllBookings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (bookings) => {
          if (bookings.length === 0) {
            this.bookingsByStatus = {
              pending: [],
              confirmed: [],
              cancelled: [],
            };
            this.loading = false;
            return;
          }

          // Separate offer bookings (need enrichment) from flight bookings
          const offerBookings = bookings.filter((b) => {
            if (b.bookingType === "flight") return false;
            return !!(b.offerId && b.offerInstanceId && b.userId);
          });

          const flightBookings: EnrichedBooking[] = bookings.filter(
            (b) => b.bookingType === "flight",
          );

          if (offerBookings.length === 0) {
            this.groupBookingsByStatus(flightBookings);
            this.loading = false;
            return;
          }

          const enrichedObservables = offerBookings.map((booking) =>
            combineLatest({
              offer: this.offerService.getOfferById(booking.offerId!),
              instance: this.offerInstanceService.getInstanceById(
                booking.offerInstanceId!,
              ),
              user: this.getUserProfile(booking.userId),
            }).pipe(
              map((data) => ({
                ...booking,
                offer: data.offer || undefined,
                instance: data.instance || undefined,
                user: data.user || undefined,
              })),
            ),
          );

          combineLatest(enrichedObservables)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (enrichedBookings) => {
                this.groupBookingsByStatus([
                  ...enrichedBookings,
                  ...flightBookings,
                ]);
                this.loading = false;
              },
              error: () => {
                this.error = this.translate.instant("manageOrders.loadError");
                this.loading = false;
              },
            });
        },
        error: () => {
          this.error = this.translate.instant("manageOrders.loadError");
          this.loading = false;
        },
      });
  }

  private getUserProfile(
    userId: string,
  ): Observable<AppUserProfile | undefined> {
    if (!userId) {
      return of(undefined);
    }
    return this.apiService.get<AppUserProfile>(`users/${userId}`);
  }

  private groupBookingsByStatus(bookings: EnrichedBooking[]): void {
    const sortByDate = (a: EnrichedBooking, b: EnrichedBooking) =>
      new Date((b.createdAt as string) || 0).getTime() -
      new Date((a.createdAt as string) || 0).getTime();
    this.bookingsByStatus = {
      pending: bookings.filter((b) => b.status === "pending").sort(sortByDate),
      confirmed: bookings
        .filter((b) => b.status === "confirmed")
        .sort(sortByDate),
      cancelled: bookings
        .filter((b) => b.status === "cancelled")
        .sort(sortByDate),
    };
  }

  requestBookingAction(
    booking: EnrichedBooking,
    action: "confirm" | "reject",
  ): void {
    if (!booking.id) {
      this.toastService.error(
        this.translate.instant("manageOrders.missingData"),
      );
      return;
    }
    this.confirmingBookingAction = { id: booking.id, action };
  }

  async confirmBooking(booking: EnrichedBooking): Promise<void> {
    this.confirmingBookingAction = null;
    if (!booking.id) return;

    this.processingBookingId = booking.id;
    try {
      await this.bookingService.confirmBooking(booking.id);
      this.toastService.success(
        this.translate.instant("manageOrders.confirmSuccess"),
      );
      this.notificationService.refresh();
      this.loadAll();
    } catch (err: any) {
      this.toastService.error(
        `${this.translate.instant("manageOrders.actionError")}: ${err?.message || ""}`,
      );
    } finally {
      this.processingBookingId = null;
    }
  }

  async rejectBooking(booking: EnrichedBooking): Promise<void> {
    this.confirmingBookingAction = null;
    if (!booking.id) return;

    this.processingBookingId = booking.id;
    try {
      await this.bookingService.rejectBooking(booking.id);
      this.toastService.success(
        this.translate.instant("manageOrders.rejectSuccess"),
      );
      this.notificationService.refresh();
      this.loadAll();
    } catch (err: any) {
      this.toastService.error(
        `${this.translate.instant("manageOrders.actionError")}: ${err?.message || ""}`,
      );
    } finally {
      this.processingBookingId = null;
    }
  }

  requestReservationAction(
    reservation: Reservation,
    action: "confirm" | "reject",
  ): void {
    this.confirmingReservationAction = { id: reservation.id, action };
  }

  async confirmReservation(reservation: Reservation): Promise<void> {
    this.confirmingReservationAction = null;
    this.processingReservationId = reservation.id;
    try {
      await this.reservationService.confirmReservation(reservation.id);
      this.toastService.success(
        this.translate.instant("manageOrders.confirmSuccess"),
      );
      this.notificationService.refresh();
      this.loadAll();
    } catch (err: any) {
      this.toastService.error(
        `${this.translate.instant("manageOrders.actionError")}: ${err?.message || ""}`,
      );
    } finally {
      this.processingReservationId = null;
    }
  }

  async rejectReservation(reservation: Reservation): Promise<void> {
    this.confirmingReservationAction = null;
    this.processingReservationId = reservation.id;
    try {
      await this.reservationService.rejectReservation(reservation.id);
      this.toastService.success(
        this.translate.instant("manageOrders.rejectSuccess"),
      );
      this.notificationService.refresh();
      this.loadAll();
    } catch (err: any) {
      this.toastService.error(
        `${this.translate.instant("manageOrders.actionError")}: ${err?.message || ""}`,
      );
    } finally {
      this.processingReservationId = null;
    }
  }

  getNights(reservation: Reservation): number {
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  trackByReservationId(_: number, res: Reservation): string {
    return res.id;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case "pending":
        return "bg-warning text-dark";
      case "confirmed":
        return "bg-success";
      case "cancelled":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  }

  getTotalExtrasPrice(booking: Booking): number {
    if (!booking.extras) return 0;
    return (
      (booking.extras.extraBaggage || 0) * 50 +
      (booking.extras.extraLegroom || 0) * 30
    );
  }

  openBookingDetails(booking: EnrichedBooking): void {
    this.selectedBooking = booking;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedBooking = null;
  }

  trackByBookingId(_: number, booking: EnrichedBooking): string {
    return booking.id ?? "";
  }

  trackByIndex(index: number): number {
    return index;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
