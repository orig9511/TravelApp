import { Component, OnDestroy, OnInit } from "@angular/core";
import { BehaviorSubject, Observable, Subject, switchMap } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Router } from "@angular/router";

import { PackageService } from "../../../services/package.service";
import { PackageDeal } from "../../../models/package-deal.model";
import { FavoriteService } from "../../../services/favorite.service";
import { HeartAnimationService } from "../../../services/heart-animation.service";

@Component({
  selector: "app-package",
  templateUrl: "./package.component.html",
  styleUrl: "./package.component.scss",
})
export class PackageComponent implements OnInit, OnDestroy {
  private cityFilter$ = new BehaviorSubject<string | undefined>(undefined);
  private destroy$ = new Subject<void>();

  packages$!: Observable<PackageDeal[]>;
  availableCities$!: Observable<string[]>;

  selectedCity = "";
  accommodationFavoriteIds = new Set<string>();

  constructor(
    private packageService: PackageService,
    private router: Router,
    public favoriteService: FavoriteService,
    private heartAnimation: HeartAnimationService,
  ) {}

  ngOnInit(): void {
    this.availableCities$ = this.packageService.getAvailableCities();
    this.packages$ = this.cityFilter$.pipe(
      switchMap((city) => this.packageService.getPackageDeals(city)),
    );

    this.favoriteService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe((favs) => {
        this.accommodationFavoriteIds = new Set(
          favs
            .filter((f) => f.accommodationId)
            .map((f) => f.accommodationId as string),
        );
      });
  }

  onCityChange(): void {
    this.cityFilter$.next(this.selectedCity || undefined);
  }

  goToAccommodation(id: string): void {
    this.router.navigate(["/accommodation", id]);
  }

  goToFlights(): void {
    this.router.navigate(["/flights"]);
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  optimizeImageUrl(url: string | undefined): string {
    if (!url) return "assets/placeholder.jpg";
    if (url.includes("unsplash.com")) {
      return url.includes("?")
        ? `${url}&w=400&q=80`
        : `${url}?w=400&q=80&auto=format`;
    }
    return url;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = "assets/placeholder.jpg";
  }

  trackByDeal(_: number, deal: PackageDeal): string {
    return `${deal.accommodation.id}-${deal.flight.id}`;
  }

  trackByCity(_: number, city: string): string {
    return city;
  }

  toggleAccommodationFavorite(
    accommodationId: string,
    event: MouseEvent,
  ): void {
    event.stopPropagation();
    const isAdding = !this.accommodationFavoriteIds.has(accommodationId);
    this.favoriteService.toggleAccommodationFavorite(accommodationId);
    if (isAdding) {
      this.heartAnimation.launch(event);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
