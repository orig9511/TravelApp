import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { combineLatest, Subject } from "rxjs";
import { takeUntil, map } from "rxjs/operators";
import { BookingService } from "../../../services/booking.service";
import { OfferService } from "../../../services/offer.service";
import { AuthService } from "../../../services/auth.service";

@Component({
  selector: "app-advertiser-panel",
  templateUrl: "./advertiser-panel.component.html",
  styleUrls: ["./advertiser-panel.component.scss"],
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
})
export class AdvertiserPanelComponent implements OnInit, OnDestroy {
  pendingCount = 0;
  confirmedCount = 0;
  activeOffersCount = 0;
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private bookingService: BookingService,
    private offerService: OfferService,
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.loading = false;
      return;
    }

    combineLatest([
      this.bookingService.getAllBookings(),
      this.offerService.getMyOffers(),
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([bookings, offers]) => ({
          pending: bookings.filter((b) => b.status === "pending").length,
          confirmed: bookings.filter((b) => b.status === "confirmed").length,
          activeOffers: offers.filter((o) => !o.isInactive && !o.notShowable)
            .length,
        })),
      )
      .subscribe({
        next: (stats) => {
          this.pendingCount = stats.pending;
          this.confirmedCount = stats.confirmed;
          this.activeOffersCount = stats.activeOffers;
          this.loading = false;
        },
        error: (err) => {
          console.error("Advertiser panel stats error:", err);
          this.loading = false;
        },
      });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
