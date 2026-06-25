import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { Router } from "@angular/router";
import { Offer } from "../../../../models/offer.model";
import { OfferFilterState } from "../../../../models/offerfilterstate.model";
import {
  LanguageService,
  Language,
} from "../../../../services/language.service";
import { Subject, fromEvent, auditTime, takeUntil } from "rxjs";
import { FavoriteService } from "../../../../services/favorite.service";
import { HeartAnimationService } from "../../../../services/heart-animation.service";

@Component({
  selector: "app-offers-list",
  templateUrl: "./offers-list.component.html",
  styleUrls: ["./offers-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OffersListComponent implements OnChanges, OnInit, OnDestroy {
  @Input() offers: Offer[] = [];
  @Input() continent: string | null = null;
  @Input() filter!: OfferFilterState;
  @Input() loading = true;

  visibleCount = 9;
  private readonly loadBatchSize = 6;
  isLoading = false;
  initialLoading = true;
  filteredOffers: Offer[] = [];
  hasMore = false;
  currentLang: Language = "hu";
  favoriteIds = new Set<string>();
  readonly skeletonItems = Array(9);
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    public languageService: LanguageService,
    public favoriteService: FavoriteService,
    private heartAnimation: HeartAnimationService,
  ) {}

  ngOnInit(): void {
    fromEvent(window, "scroll")
      .pipe(auditTime(150), takeUntil(this.destroy$))
      .subscribe(() => {
        this.onWindowScroll();
      });

    this.favoriteService.favoriteIds$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ids) => {
        this.favoriteIds = new Set(
          ids.filter((id): id is string => id !== null),
        );
        this.cdr.markForCheck();
      });

    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lang) => {
        this.currentLang = lang;
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["offers"] || changes["continent"] || changes["filter"]) {
      this.visibleCount = 9;
      this.recomputeFilteredOffers();
    }
    if (changes["loading"] && !this.loading) {
      this.initialLoading = false;
      this.cdr.markForCheck();
    }
  }

  private recomputeFilteredOffers(): void {
    const filter = this.filter || {};

    const result = this.offers.filter((o) => {
      // ===== VISIBILITY: exclude notShowable offers =====
      if (o.notShowable === true) return false;

      if (this.continent && o.continent !== this.continent) return false;

      if (filter.minPrice !== undefined && o.price < filter.minPrice)
        return false;
      if (filter.maxPrice !== undefined && o.price > filter.maxPrice)
        return false;

      if (filter.minDays !== undefined && o.days < filter.minDays) return false;
      if (filter.maxDays !== undefined && o.days > filter.maxDays) return false;

      if (filter.persons !== undefined && o.persons < filter.persons)
        return false;

      if (filter.minStars !== undefined && o.hotelStars < filter.minStars)
        return false;

      if (filter.travelCategory && o.travelCategory !== filter.travelCategory)
        return false;

      if (filter.travelDate) {
        if (!o.travelPeriodStart || !o.travelPeriodEnd) return false;

        const selected = new Date(filter.travelDate).getTime();
        const start = new Date(o.travelPeriodStart).getTime();
        const end = new Date(o.travelPeriodEnd).getTime();

        if (isNaN(start) || isNaN(end)) return false;
        if (selected < start || selected > end) return false;
      }

      return true;
    });

    const totalFiltered = result.length;

    if (!this.continent) {
      this.filteredOffers = result.slice(0, this.visibleCount);
      this.hasMore = this.filteredOffers.length < totalFiltered;
    } else {
      this.filteredOffers = result;
      this.hasMore = false;
    }
  }

  goToDetails(id: string, isInactive?: boolean) {
    if (isInactive) return; // Don't navigate if inactive
    this.router.navigate(["/offers", id]);
  }

  toggleFavorite(offerId: string, event: MouseEvent): void {
    event.stopPropagation();
    const isAdding = !this.favoriteService.isFavorite(offerId);
    this.favoriteService.toggleFavorite(offerId);
    if (isAdding) {
      this.heartAnimation.launch(event);
    }
  }

  onWindowScroll(): void {
    if (this.continent) return;
    if (this.isLoading) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 200;

    if (scrollPosition >= threshold) {
      this.loadMore();
    }
  }

  loadMore(): void {
    if (this.continent) return;
    if (this.isLoading) return;
    if (this.visibleCount >= this.offers.length) return;

    this.isLoading = true;

    setTimeout(() => {
      this.visibleCount = Math.min(
        this.visibleCount + this.loadBatchSize,
        this.offers.length,
      );
      this.recomputeFilteredOffers();
      this.isLoading = false;
      this.cdr.markForCheck();
    }, 400);
  }

  trackByOfferId(index: number, offer: Offer): string {
    return offer.id;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private readonly PLACEHOLDER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23e9ecef'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23adb5bd' font-size='14' font-family='sans-serif'%3ENo image%3C/text%3E%3C/svg%3E";

  optimizeImageUrl(url: string): string {
    if (!url) return this.PLACEHOLDER;
    if (url.includes("images.unsplash.com") && !url.includes("?")) {
      return url + "?w=400&q=75&auto=format&fit=crop";
    }
    return url;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.PLACEHOLDER;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
