import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { OfferService } from "../../../services/offer.service";
import { Offer } from "../../../models/offer.model";
import { OfferFilterState } from "../../../models/offerfilterstate.model";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: "app-offers",
  templateUrl: "./offers.component.html",
  styleUrls: ["./offers.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OffersComponent implements OnInit, OnDestroy {
  offers: Offer[] = [];
  filteredOffers: Offer[] = [];
  selectedContinent: string | null = null;
  filterState: OfferFilterState = {};
  offersLoading = true;

  @ViewChild("resultsSection") resultsSection!: ElementRef;

  private destroy$ = new Subject<void>();

  continents: string[] = [
    "Europe",
    "Asia",
    "North America",
    "South America",
    "Africa",
    "Australia",
  ];

  constructor(
    private offerService: OfferService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params["continent"]) {
          this.selectedContinent = params["continent"];
        }
      });

    this.offerService
      .getOffers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((offers) => {
        this.offers = offers;
        this.offersLoading = false;
        this.applyFilters();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onContinentChange(continent: string | null): void {
    this.selectedContinent = continent;
    this.applyFilters();
    setTimeout(() => {
      if (!this.resultsSection) return;
      const yOffset = -80;
      const y =
        this.resultsSection.nativeElement.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }, 0);
  }

  onFilterChange(filters: OfferFilterState): void {
    this.filterState = filters;
    this.applyFilters();
  }

  closeMobileFilter() {
    const element = document.getElementById("mobileFilter");
    if (element) {
      const offcanvas = (window as any).bootstrap.Offcanvas.getInstance(
        element,
      );
      offcanvas?.hide();
    }
  }

  resetAll(): void {
    this.selectedContinent = null;
    this.filterState = {};
    this.filteredOffers = this.offers;
    this.cdr.markForCheck();
  }

  private applyFilters(): void {
    let result = [...this.offers];

    if (this.selectedContinent) {
      result = result.filter(
        (offer) => offer.continent === this.selectedContinent,
      );
    }

    result = this.offerService.filterOffers(result, this.filterState);

    this.filteredOffers = result;
  }

  trackByContinent(index: number, continent: string): string {
    return continent;
  }
}
