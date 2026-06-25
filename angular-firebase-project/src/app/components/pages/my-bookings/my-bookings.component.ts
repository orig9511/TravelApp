import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { IsoDatePipe } from "../../../shared/pipes/iso-date.pipe";
import { combineLatest, forkJoin, Observable, Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";

import { Booking } from "../../../models/booking.model";
import { Reservation } from "../../../models/reservation.model";
import { Offer } from "../../../models/offer.model";
import { OfferInstance } from "../../../models/offer-instance.model";
import { BookingService } from "../../../services/booking.service";
import { OfferService } from "../../../services/offer.service";
import { OfferInstanceService } from "../../../services/offer-instance.service";
import { ReservationService } from "../../../services/reservation.service";
import { ToastService } from "../../../services/toast.service";

export interface EnrichedBooking extends Booking {
  offer?: Offer;
  instance?: OfferInstance;
}

@Component({
  selector: "app-my-bookings",
  templateUrl: "./my-bookings.component.html",
  styleUrls: ["./my-bookings.component.scss"],
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, IsoDatePipe],
})
export class MyBookingsComponent implements OnInit, OnDestroy {
  bookings: EnrichedBooking[] = [];
  reservations: Reservation[] = [];
  loading = true;
  error: string | null = null;

  confirmingBookingId: string | null = null;
  confirmingReservationId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private bookingService: BookingService,
    private offerService: OfferService,
    private offerInstanceService: OfferInstanceService,
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
      bookings: this.bookingService.getMyBookings(),
      reservations: this.reservationService.getMyReservations(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ bookings, reservations }) => {
          this.reservations = reservations;
          this.processBookings(bookings);
        },
        error: () => {
          this.error = this.translate.instant("myBookings.loadError");
          this.loading = false;
        },
      });
  }

  private processBookings(bookings: Booking[]): void {
    const validBookings = bookings.filter((booking) => {
      if (booking.bookingType === "flight") return true;
      return !!(booking.offerId && booking.offerInstanceId);
    });

    const offerBookings = validBookings.filter(
      (b) => b.bookingType !== "flight",
    );
    const flightBookings = validBookings.filter(
      (b) => b.bookingType === "flight",
    );

    if (offerBookings.length === 0) {
      this.bookings = [...flightBookings].sort(this.byDateDesc);
      this.loading = false;
      return;
    }

    const enriched$ = offerBookings.map((booking) =>
      combineLatest({
        offer: this.offerService.getOfferById(booking.offerId!),
        instance: this.offerInstanceService.getInstanceById(
          booking.offerInstanceId!,
        ),
      }).pipe(
        map((data) => ({
          ...booking,
          offer: data.offer || undefined,
          instance: data.instance || undefined,
        })),
      ),
    );

    combineLatest(enriched$)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (enrichedBookings) => {
          this.bookings = [...enrichedBookings, ...flightBookings].sort(
            this.byDateDesc,
          );
          this.loading = false;
        },
        error: () => {
          this.error = this.translate.instant("myBookings.loadError");
          this.loading = false;
        },
      });
  }

  private byDateDesc(a: { createdAt: any }, b: { createdAt: any }): number {
    return (
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
    );
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

  getStatusLabel(status: string): string {
    switch (status) {
      case "pending":
        return "myBookings.statusPending";
      case "confirmed":
        return "myBookings.statusConfirmed";
      case "cancelled":
        return "myBookings.statusCancelled";
      default:
        return status;
    }
  }

  getTotalExtrasPrice(booking: Booking): number {
    if (!booking.extras) return 0;
    return (
      (booking.extras.extraBaggage || 0) * 50 +
      (booking.extras.extraLegroom || 0) * 30
    );
  }

  canCancel(booking: Booking): boolean {
    return booking.status === "pending";
  }

  canCancelReservation(reservation: Reservation): boolean {
    return reservation.status === "pending";
  }

  getNights(reservation: Reservation): number {
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  requestCancelBooking(booking: Booking): void {
    if (!this.canCancel(booking)) {
      this.toastService.warning(
        this.translate.instant("myBookings.cancelNotAllowed"),
      );
      return;
    }
    this.confirmingBookingId = booking.id!;
  }

  async confirmCancelBooking(booking: Booking): Promise<void> {
    this.confirmingBookingId = null;
    try {
      await this.bookingService.cancelBookingByUser(booking.id!);
      this.toastService.success(
        this.translate.instant("myBookings.cancelSuccess"),
      );
      this.loadAll();
    } catch (error: any) {
      this.toastService.error(
        `${this.translate.instant("myBookings.cancelError")}: ${error.message || ""}`.trim(),
      );
    }
  }

  requestCancelReservation(reservation: Reservation): void {
    if (!this.canCancelReservation(reservation)) {
      this.toastService.warning(
        this.translate.instant("myBookings.reservationCancelNotAllowed"),
      );
      return;
    }
    this.confirmingReservationId = reservation.id;
  }

  async confirmCancelReservation(reservation: Reservation): Promise<void> {
    this.confirmingReservationId = null;
    try {
      await this.reservationService.cancelReservation(reservation.id);
      this.toastService.success(
        this.translate.instant("myBookings.reservationCancelSuccess"),
      );
      this.loadAll();
    } catch (error: any) {
      this.toastService.error(
        `${this.translate.instant("myBookings.cancelError")}: ${error.message || ""}`.trim(),
      );
    }
  }

  trackByBookingId(_: number, booking: any): string {
    return booking.id;
  }

  trackByReservationId(_: number, res: Reservation): string {
    return res.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
