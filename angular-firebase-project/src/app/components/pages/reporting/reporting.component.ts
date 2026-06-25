import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { OfferDetailsModalComponent } from "./offer-details-modal/offer-details-modal.component";
import { combineLatest, Observable, Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { OfferService } from "../../../services/offer.service";
import { BookingService } from "../../../services/booking.service";
import { OfferInstanceService } from "../../../services/offer-instance.service";
import { Offer } from "../../../models/offer.model";
import { Booking } from "../../../models/booking.model";
import { OfferInstance } from "../../../models/offer-instance.model";
import { OfferAnalytics } from "../../../models/offer-analytics.model";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../../../services/auth.service";

interface OfferReportData {
  offer: Offer;
  confirmedCount: number;
  cancelledCount: number;
  totalBooked: number;
  totalCapacity: number;
  occupancyRate: number;
}

@Component({
  selector: "app-reporting",
  templateUrl: "./reporting.component.html",
  styleUrls: ["./reporting.component.scss"],
  standalone: true,
  imports: [CommonModule, TranslateModule, OfferDetailsModalComponent],
})
export class ReportingComponent implements OnInit, OnDestroy {
  loading = true;
  myOffers: Offer[] = [];
  allBookings: Booking[] = [];
  reportData: OfferReportData[] = [];
  selectedOffer: OfferReportData | null = null;

  // Analytics data
  mostViewedOffers$!: Observable<Offer[]>;
  mostFavoritedOffers$!: Observable<Offer[]>;

  // Modal state
  showModal = false;
  modalOffer: Offer | null = null;
  modalAnalytics: OfferAnalytics | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private offerService: OfferService,
    private bookingService: BookingService,
    private offerInstanceService: OfferInstanceService,
  ) {}

  ngOnInit(): void {
    // Load analytics data
    this.mostViewedOffers$ = this.offerService.getMostViewedOffers(5);
    this.mostFavoritedOffers$ = this.offerService.getMostFavoritedOffers(5);

    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.loading = false;
      return;
    }

    // Backend filters both offers and bookings by role:
    // ADVERTISER → only own offers/bookings; ADMIN → all
    combineLatest([
      this.offerService.getMyOffers(),
      this.bookingService.getAllBookings(),
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([myOffers, bookings]) => {
          const myOfferIds = new Set(myOffers.map((o) => o.id));
          const relevantBookings = bookings.filter(
            (b) => b.offerId && myOfferIds.has(b.offerId),
          );
          return { myOffers, relevantBookings };
        }),
      )
      .subscribe({
        next: ({ myOffers, relevantBookings }) => {
          this.myOffers = myOffers;
          this.allBookings = relevantBookings;
          this.buildReportData();
          this.loading = false;
        },
        error: (err) => {
          console.error("Reporting adatok betöltési hiba:", err);
          this.loading = false;
        },
      });
  }

  private buildReportData(): void {
    this.reportData = this.myOffers.map((offer) => {
      const offerBookings = this.allBookings.filter(
        (b) => b.offerId === offer.id,
      );

      const confirmedBookings = offerBookings.filter(
        (b) => b.status === "confirmed",
      );
      const cancelledBookings = offerBookings.filter(
        (b) => b.status === "cancelled",
      );

      const confirmedCount = confirmedBookings.length;
      const cancelledCount = cancelledBookings.length;

      // Calculate total booked (sum of quantities from confirmed bookings)
      const totalBooked = confirmedBookings.reduce(
        (sum, b) => sum + b.quantity,
        0,
      );

      // Total capacity is per-offer capacity (assuming it represents max capacity)
      // In reality, you might want to sum instance capacities
      const totalCapacity = offer.persons * 10; // Rough estimate
      const occupancyRate =
        totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;

      return {
        offer,
        confirmedCount,
        cancelledCount,
        totalBooked,
        totalCapacity,
        occupancyRate: Math.round(occupancyRate * 10) / 10, // 1 decimal
      };
    });
  }

  /**
   * Open modal with detailed analytics for an offer
   */
  async openOfferDetails(data: OfferReportData): Promise<void> {
    try {
      const analytics = await firstValueFrom(
        this.offerService.getOfferAnalytics(data.offer.id),
      );

      this.modalOffer = data.offer;
      this.modalAnalytics = analytics;
      this.showModal = true;
    } catch (error) {
      console.error("Error loading offer analytics:", error);
      alert("Hiba történt az adatok betöltésekor");
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.modalOffer = null;
    this.modalAnalytics = null;
  }

  selectOffer(data: OfferReportData): void {
    this.selectedOffer = data;
  }

  clearSelection(): void {
    this.selectedOffer = null;
  }

  getBarWidth(count: number, type: "confirmed" | "cancelled"): number {
    if (this.reportData.length === 0) return 0;

    // Find max count for this type
    const maxCount = Math.max(
      ...this.reportData.map((d) =>
        type === "confirmed" ? d.confirmedCount : d.cancelledCount,
      ),
      1, // Min 1 to avoid division by zero
    );

    return (count / maxCount) * 100;
  }

  trackByReportData(_: number, data: OfferReportData): string {
    return data.offer.id;
  }

  trackByOfferId(_: number, offer: Offer): string {
    return offer.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
