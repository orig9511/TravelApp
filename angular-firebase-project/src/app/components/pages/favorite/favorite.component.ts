import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { combineLatest, Observable, Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";

import { FavoriteService } from "../../../services/favorite.service";
import { OfferService } from "../../../services/offer.service";
import { Offer } from "../../../models/offer.model";
import { Favorite } from "../../../models/favorite.model";
import { LanguageService } from "../../../services/language.service";
import { SmartPricePipe } from "../../../shared/pipes/smart-price.pipe";

@Component({
  selector: "app-favorite",
  templateUrl: "./favorite.component.html",
  styleUrls: ["./favorite.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, SmartPricePipe],
})
export class FavoriteComponent implements OnInit, OnDestroy {
  favoriteOffers$!: Observable<Offer[]>;
  accommodationFavorites$!: Observable<Favorite[]>;
  private destroy$ = new Subject<void>();

  constructor(
    private favoriteService: FavoriteService,
    private offerService: OfferService,
    public languageService: LanguageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.favoriteOffers$ = combineLatest([
      this.offerService.getOffers(),
      this.favoriteService.favorites$,
    ]).pipe(
      map(([offers, favorites]) => {
        const favoriteMap = new Map(
          favorites.filter((f) => f.offerId).map((f) => [f.offerId, f]),
        );
        return offers
          .filter((offer) => favoriteMap.has(offer.id))
          .filter((offer) => !offer.notShowable)
          .sort((a, b) => {
            const savedAtA = favoriteMap.get(a.id)!.savedAt;
            const savedAtB = favoriteMap.get(b.id)!.savedAt;
            return savedAtB - savedAtA;
          });
      }),
    );

    this.accommodationFavorites$ = this.favoriteService.favorites$.pipe(
      map((favs) => favs.filter((f) => f.accommodationId && f.accommodation)),
    );
  }

  trackByOfferId(_index: number, offer: Offer): string {
    return offer.id;
  }

  trackByFavId(_index: number, fav: Favorite): string {
    return fav.id ?? fav.accommodationId ?? "";
  }

  optimizeImageUrl(url: string): string {
    if (!url) return "assets/placeholder.jpg";
    if (url.includes("images.unsplash.com") && !url.includes("?")) {
      return url + "?w=400&q=80&auto=format";
    }
    return url;
  }

  isFavorite(offerId: string): boolean {
    return this.favoriteService.isFavorite(offerId);
  }

  removeFavorite(offerId: string): void {
    this.favoriteService.removeFavorite(offerId);
  }

  removeAccommodationFavorite(accommodationId: string): void {
    this.favoriteService.toggleAccommodationFavorite(accommodationId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
