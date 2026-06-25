import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { OfferService } from "../../../../services/offer.service";
import { Offer } from "../../../../models/offer.model";
import { Observable, Subject, takeUntil } from "rxjs";
import { FavoriteService } from "../../../../services/favorite.service";
import { OfferInstanceService } from "../../../../services/offer-instance.service";
import { OfferInstance } from "../../../../models/offer-instance.model";
import { LanguageService } from "../../../../services/language.service";
import { Language } from "../../../../services/language.service";

@Component({
  selector: "app-offer-detail",
  templateUrl: "./offer-detail.component.html",
  styleUrls: ["./offer-detail.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferDetailComponent implements OnInit, OnDestroy {
  offer: Offer | null = null;
  loading = true;
  isFavorite = false;
  currentLang: Language = "hu";

  selectedImage: string | null = null;

  instances$!: Observable<OfferInstance[]>;
  selectedInstance: OfferInstance | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private offerService: OfferService,
    private cdr: ChangeDetectorRef,
    private favoriteService: FavoriteService,
    private offerInstanceService: OfferInstanceService,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.loading = false;
      return;
    }

    this.instances$ = this.offerInstanceService.getInstancesByOfferId(id);

    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lang) => {
        this.currentLang = lang;
        this.cdr.markForCheck();
      });

    // Track view count (fire-and-forget, don't wait for completion)
    void this.offerService.incrementViewCount(id);

    // Keep isFavorite in sync with the favorites stream (OnPush-safe)
    this.favoriteService.favoriteIds$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ids) => {
        this.isFavorite = ids.includes(id);
        this.cdr.markForCheck();
      });

    this.offerService
      .getOfferById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (offer) => {
          if (!offer) {
            this.loading = false;
            this.cdr.markForCheck();
            return;
          }

          this.offer = offer;

          if (offer.images && offer.images.length > 0) {
            this.selectedImage = offer.images[0];
          } else {
            this.selectedImage = null;
          }

          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error("Offer detail betöltési hiba:", err);
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  selectImage(img: string) {
    this.selectedImage = img;
  }

  trackByImage(index: number, img: string): string {
    return img || String(index);
  }

  toggleFavorite(): void {
    if (this.offer) {
      this.favoriteService.toggleFavorite(this.offer.id);
    }
  }

  selectInstance(instance: OfferInstance): void {
    this.selectedInstance = instance;
    this.cdr.markForCheck();
  }

  goToBooking(): void {
    if (!this.offer || !this.selectedInstance) return;
    this.router.navigate(["/booking", this.offer.id, this.selectedInstance.id]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByInstanceId(_: number, instance: OfferInstance): string {
    return instance.id;
  }
}
