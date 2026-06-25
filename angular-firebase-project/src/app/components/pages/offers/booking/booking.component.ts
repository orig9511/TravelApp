import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { IsoDatePipe } from "../../../../shared/pipes/iso-date.pipe";
import { PaymentLoadingComponent } from "./payment-loading/payment-loading.component";
import { SmartPricePipe } from "../../../../shared/pipes/smart-price.pipe";
import { combineLatest, firstValueFrom, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { Offer } from "../../../../models/offer.model";
import { OfferInstance } from "../../../../models/offer-instance.model";
import { Passenger, BookingExtras } from "../../../../models/booking.model";
import { OfferService } from "../../../../services/offer.service";
import { OfferInstanceService } from "../../../../services/offer-instance.service";
import { BookingService } from "../../../../services/booking.service";
import { AuthService } from "../../../../services/auth.service";
import { NotificationService } from "../../../../services/notification.service";

@Component({
  selector: "app-booking",
  styleUrls: ["./booking.component.scss"],
  templateUrl: "./booking.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    IsoDatePipe,
    SmartPricePipe,
    PaymentLoadingComponent,
  ],
})
export class BookingComponent implements OnInit, OnDestroy {
  offer: Offer | null = null;
  instance: OfferInstance | null = null;

  quantity = 1;
  loading = true;
  submitting = false;
  showPaymentLoading = false;
  error: string | null = null;
  confirmed = false;

  // Passenger data
  passengers: Passenger[] = [];

  // Extras
  extras: BookingExtras = {
    extraBaggage: 0,
    extraLegroom: 0,
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private offerService: OfferService,
    private offerInstanceService: OfferInstanceService,
    private bookingService: BookingService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const offerId = this.route.snapshot.paramMap.get("offerId");
    const instanceId = this.route.snapshot.paramMap.get("instanceId");

    if (!offerId || !instanceId) {
      this.error = "Érvénytelen foglalási hivatkozás";
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    combineLatest([
      this.offerService.getOfferById(offerId),
      this.offerInstanceService.getInstanceById(instanceId),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([offer, instance]) => {
          if (!offer || !instance) {
            this.error = "Az ajánlat vagy az időpont nem található";
            this.loading = false;
            this.cdr.markForCheck();
            return;
          }

          if (instance.offerId !== offerId) {
            this.error = "Az időpont nem tartozik ehhez az ajánlathoz";
            this.loading = false;
            this.cdr.markForCheck();
            return;
          }

          this.offer = offer;
          this.instance = instance;
          this.initializePassengers();
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error("Foglalás betöltési hiba:", err);
          this.error = "Hiba történt az adatok betöltésekor";
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  get needsPassengerData(): boolean {
    return (
      this.offer?.travelCategory === "flight" ||
      this.offer?.travelCategory === "tour"
    );
  }

  get extrasAvailable(): boolean {
    return !!(
      this.instance?.extrasCapacity &&
      (this.instance.extrasCapacity.extraBaggage > 0 ||
        this.instance.extrasCapacity.extraLegroom > 0)
    );
  }

  get totalPrice(): number {
    if (!this.instance) return 0;

    const basePrice = this.quantity * this.instance.pricePerPerson;
    const baggagePrice = (this.extras.extraBaggage || 0) * 50;
    const legroomPrice = (this.extras.extraLegroom || 0) * 30;

    return basePrice + baggagePrice + legroomPrice;
  }

  get maxExtraBaggage(): number {
    return this.instance?.extrasCapacity?.extraBaggage || 0;
  }

  get maxExtraLegroom(): number {
    return this.instance?.extrasCapacity?.extraLegroom || 0;
  }

  initializePassengers(): void {
    this.passengers = [];
    for (let i = 0; i < this.quantity; i++) {
      this.passengers.push({
        fullName: "",
        phoneNumber: "",
        address: "",
        documentType: "passport",
        documentNumber: "",
      });
    }

    // Auto-fill first passenger with current user's name
    if (this.quantity > 0) {
      this.authService
        .getCurrentUserProfile()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (profile) => {
            if (profile && this.passengers[0]) {
              const fullName =
                `${profile.lastName} ${profile.firstName}`.trim();
              if (fullName && !this.passengers[0].fullName) {
                this.passengers[0].fullName = fullName;
                this.cdr.markForCheck();
              }
            }
          },
          error: (err) => console.error("Error fetching user profile:", err),
        });
    }
  }

  onQuantityChange(): void {
    // Adjust passenger array length
    while (this.passengers.length < this.quantity) {
      this.passengers.push({
        fullName: "",
        phoneNumber: "",
        address: "",
        documentType: "passport",
        documentNumber: "",
      });
    }
    while (this.passengers.length > this.quantity) {
      this.passengers.pop();
    }
    this.cdr.markForCheck();
  }

  validatePassengers(): boolean {
    if (!this.needsPassengerData) return true;

    return this.passengers.every(
      (p) =>
        p.fullName.trim() &&
        p.phoneNumber.trim() &&
        p.address.trim() &&
        p.documentType &&
        p.documentNumber.trim(),
    );
  }

  async confirmBooking(): Promise<void> {
    if (!this.offer || !this.instance) return;
    if (
      this.quantity < 1 ||
      this.quantity >
        (this.instance.availableCapacity ?? this.instance.capacity)
    )
      return;

    // Validate passenger data if required
    if (this.needsPassengerData && !this.validatePassengers()) {
      this.error = "Kérjük, töltse ki az összes utas adatait";
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.showPaymentLoading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      // Simulate payment processing delay (3 seconds)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await firstValueFrom(
        this.bookingService.createBooking({
          offerId: this.offer.id,
          offerInstanceId: this.instance.id,
          quantity: this.quantity,
          passengers: this.needsPassengerData ? this.passengers : undefined,
          extras:
            this.extras.extraBaggage > 0 || this.extras.extraLegroom > 0
              ? this.extras
              : undefined,
        }),
      );
      this.confirmed = true;
      this.notificationService.refresh();
    } catch (err: any) {
      this.error = err?.message ?? "Hiba történt a foglalás során";
    } finally {
      this.showPaymentLoading = false;
      this.submitting = false;
      this.cdr.markForCheck();
    }
  }

  goBackToOffer(): void {
    if (this.offer) {
      this.router.navigate(["/offers", this.offer.id]);
    } else {
      this.router.navigate(["/offers"]);
    }
  }

  /**
   * Format duration from minutes to "Xh Ym" format
   * @param minutes - Total duration in minutes
   * @returns Formatted string like "2h 15m"
   */
  formatDuration(minutes: number): string {
    if (!minutes || minutes === 0) return "-";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByIndex(index: number): number {
    return index;
  }
}
