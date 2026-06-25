import { LodgingService } from "./../../../../services/lodging.service";
import { FavoriteService } from "../../../../services/favorite.service";
import { HeartAnimationService } from "../../../../services/heart-animation.service";
import { TranslateService } from "@ngx-translate/core";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { AccommodationModel } from "../../../../models/lodging.model";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../../../../services/auth.service";

@Component({
  selector: "app-accommodation-details",
  templateUrl: "./accommodation-details.component.html",
  styleUrl: "./accommodation-details.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccommodationDetailsComponent implements OnInit, OnDestroy {
  private lodgingService = inject(LodgingService);
  private authService = inject(AuthService);
  private favoriteService = inject(FavoriteService);
  private heartAnimation = inject(HeartAnimationService);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);

  accommodation: AccommodationModel | null = null;
  loading = true;
  error: string | null = null;

  // Date selection
  startDate = "";
  endDate = "";
  persons = 1;
  selectedImageIndex = 0;

  isLoggedIn = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  get currentDescription(): string {
    if (!this.accommodation) return "";
    const lang = this.translate.currentLang || this.translate.defaultLang;
    if (lang === "hu" && this.accommodation.descriptionHu) {
      return this.accommodation.descriptionHu;
    }
    return this.accommodation.description || "";
  }

  get currentLang(): string {
    return this.translate.currentLang || this.translate.defaultLang || "en";
  }

  get nights(): number {
    if (!this.startDate || !this.endDate) return 0;
    const diff =
      new Date(this.endDate).getTime() - new Date(this.startDate).getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }

  get totalPrice(): number {
    if (!this.accommodation) return 0;
    return this.accommodation.price * this.persons * this.nights;
  }

  get minCheckout(): string {
    if (!this.startDate) return "";
    const next = new Date(this.startDate);
    next.setDate(next.getDate() + 1);
    return next.toISOString().split("T")[0];
  }

  get minCheckin(): string {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  get galleryImages(): string[] {
    const acc = this.accommodation;
    if (!acc) return [];
    const imgs: string[] = [];
    if (acc.imageUrl) imgs.push(acc.imageUrl);
    return imgs;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.error = "Hiányzó szállás azonosító";
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((u) => {
      this.isLoggedIn = !!u;
      this.cdr.markForCheck();
    });

    this.favoriteService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.lodgingService
      .getAccommodationById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (acc) => {
          this.accommodation = acc;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = "Nem sikerült betölteni a szállás adatait.";
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
    this.cdr.markForCheck();
  }

  get isFavorited(): boolean {
    return this.accommodation
      ? this.favoriteService.isAccommodationFavorite(this.accommodation.id!)
      : false;
  }

  toggleFavorite(event: MouseEvent): void {
    if (this.accommodation?.id) {
      const isAdding = !this.favoriteService.isAccommodationFavorite(
        this.accommodation.id,
      );
      this.favoriteService.toggleAccommodationFavorite(this.accommodation.id);
      if (isAdding) {
        this.heartAnimation.launch(event);
      }
    }
  }

  goToReservation(): void {
    if (!this.accommodation) return;
    this.router.navigate(["accommodation/reservation", this.accommodation.id], {
      state: {
        startDate: this.startDate,
        endDate: this.endDate,
        persons: this.persons,
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
