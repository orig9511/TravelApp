import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";
import { Router } from "@angular/router";
import { ApiService } from "../core/api.service";
import { AuthService } from "./auth.service";
import { Favorite } from "../models/favorite.model";

@Injectable({ providedIn: "root" })
export class FavoriteService {
  private readonly favoritesSubject = new BehaviorSubject<Favorite[]>([]);

  readonly favorites$ = this.favoritesSubject.asObservable();
  readonly favoriteIds$ = this.favorites$.pipe(
    map((favs) =>
      favs.map((f) => f.offerId).filter((id): id is string => id !== null),
    ),
  );
  readonly favoriteCount$ = this.favorites$.pipe(map((favs) => favs.length));

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.loadFavorites();
      } else {
        this.favoritesSubject.next([]);
      }
    });
  }

  isFavorite(offerId: string): boolean {
    return this.favoritesSubject.value.some((f) => f.offerId === offerId);
  }

  isAccommodationFavorite(accommodationId: string): boolean {
    return this.favoritesSubject.value.some(
      (f) => f.accommodationId === accommodationId,
    );
  }

  toggleFavorite(offerId: string): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(["/login"]);
      return;
    }
    if (this.isFavorite(offerId)) {
      this.removeFavorite(offerId);
    } else {
      this.addFavorite(offerId);
    }
  }

  toggleAccommodationFavorite(accommodationId: string): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(["/login"]);
      return;
    }
    this.api
      .post<{
        favorited: boolean;
      }>(`favorites/accommodation/${accommodationId}/toggle`, {})
      .subscribe({
        next: () => this.loadFavorites(),
        error: (err) =>
          console.error("Failed to toggle accommodation favorite:", err),
      });
  }

  addFavorite(offerId: string): void {
    this.api
      .post<{ favorited: boolean }>(`favorites/${offerId}/toggle`, {})
      .subscribe({
        next: () => this.loadFavorites(),
        error: (err) => console.error("Failed to add favorite:", err),
      });
  }

  removeFavorite(offerId: string): void {
    this.api.delete<void>(`favorites/${offerId}`).subscribe({
      next: () => {
        this.favoritesSubject.next(
          this.favoritesSubject.value.filter((f) => f.offerId !== offerId),
        );
      },
      error: (err) => console.error("Failed to remove favorite:", err),
    });
  }

  private loadFavorites(): void {
    this.api.get<Favorite[]>("favorites").subscribe({
      next: (favs) => this.favoritesSubject.next(favs),
      error: (err) => console.error("Failed to load favorites:", err),
    });
  }
}
