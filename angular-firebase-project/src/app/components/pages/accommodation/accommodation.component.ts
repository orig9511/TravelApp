import { LodgingFilter } from "./../../../models/lodgingFilter.model";
import { AccommodationModel } from "./../../../models/lodging.model";
import { LodgingService } from "./../../../services/lodging.service";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { DateRange } from "@angular/material/datepicker";
import { DatePickerComponent } from "./date-picker/date-picker.component";
import { Router } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { SmartPricePipe } from "../../../shared/pipes/smart-price.pipe";
import { FavoriteService } from "../../../services/favorite.service";
import { HeartAnimationService } from "../../../services/heart-animation.service";

@Component({
  selector: "app-accommodation",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePickerComponent,
    TranslateModule,
    SmartPricePipe,
  ],
  templateUrl: "./accommodation.component.html",
  styleUrl: "./accommodation.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccommodationComponent implements OnInit, OnDestroy {
  lodgingFilered$?: Observable<AccommodationModel[]>;
  citySuggestions$?: Observable<string[]>;
  accommodationFavoriteIds = new Set<string>();
  private destroy$ = new Subject<void>();

  lodgingFilter: LodgingFilter = {
    city: "",
    persons: 0,
    maxPrice: 0,
    type: "all",
    services: [],
    travelers_rating: 0,
    startDate: null,
    endDate: null,
  };

  maxPrice: number[] = [50, 100, 150, 200, 250];
  lodgingtype: string[] = ["Guesthouse", "Hotel"];
  services: string[] = ["breakfast", "pet-friendly", "balcony", "wellness"];
  rating: number[] = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  constructor(
    private lodgingService: LodgingService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public favoriteService: FavoriteService,
    private heartAnimation: HeartAnimationService,
  ) {}

  ngOnInit(): void {
    this.lodgingFilered$ = this.lodgingService.getTopLodgingsByPrice(10);

    this.favoriteService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe((favs) => {
        this.accommodationFavoriteIds = new Set(
          favs
            .filter((f) => f.accommodationId)
            .map((f) => f.accommodationId as string),
        );
        this.cdr.markForCheck();
      });
  }

  goToDetails(id: string) {
    this.router.navigate(["/accommodation", id]);
  }

  getFiltered(): void {
    const hasFilter =
      !!this.lodgingFilter.city ||
      !!this.lodgingFilter.persons ||
      (this.lodgingFilter.maxPrice ?? 0) > 0 ||
      (this.lodgingFilter.travelers_rating ?? 0) > 0 ||
      (this.lodgingFilter.type && this.lodgingFilter.type !== "all") ||
      !!this.lodgingFilter.services?.length ||
      !!this.lodgingFilter.startDate;

    if (!hasFilter) {
      this.lodgingFilered$ = this.lodgingService.getTopLodgingsByPrice(10);
      this.cdr.markForCheck();
      return;
    }

    this.lodgingFilered$ = this.lodgingService.getFilteredLodgings(
      this.lodgingFilter,
    );
    this.cdr.markForCheck();
  }

  citySugest(): void {
    const term = this.lodgingFilter.city;
    if (term && term.trim() !== "") {
      this.citySuggestions$ = this.lodgingService.getCitySuggestions(term);
    } else {
      this.citySuggestions$ = undefined;
    }
    this.cdr.markForCheck();
  }

  selectCity(city: string): void {
    this.lodgingFilter.city = city;
    this.citySuggestions$ = undefined;
    this.cdr.markForCheck();
    this.getFiltered();
  }

  serviceChecked(service: string): void {
    const currentServices = this.lodgingFilter.services || [];
    if (currentServices.includes(service)) {
      this.lodgingFilter.services = currentServices.filter(
        (s) => s !== service,
      );
    } else {
      this.lodgingFilter.services = [...currentServices, service];
    }
    this.getFiltered();
  }

  onDateRangePicked(range: DateRange<Date>): void {
    this.lodgingFilter.startDate = range.start;
    this.lodgingFilter.endDate = range.end;
    this.getFiltered(); // Azonnali szűrés
  }

  trackByLodgingId(_: number, lodging: AccommodationModel): string {
    return lodging.id;
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByValue(_: number, value: string | number): string | number {
    return value;
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
