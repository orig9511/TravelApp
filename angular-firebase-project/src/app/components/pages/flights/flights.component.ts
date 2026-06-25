import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { forkJoin, Subject } from "rxjs";
import { take, takeUntil } from "rxjs/operators";

import { Flight } from "./flight-models/flight.model";
import { FlightCardVM, TimeSlot } from "./flight-models/flight-card-vm.model";
import {
  FlightFilters,
  FlightsFiltersSidebarComponent,
} from "./components/flights-filters-sidebar/flights-filters-sidebar.component";
import { FlightSearchForm } from "./components/flights-search-bar/flights-search-bar.component";
import { FlightSortOption } from "./components/flights-sort-bar/flights-sort-bar.component";
import { FlightService } from "../../../services/flight.service";

const SORT_MAP: Record<FlightSortOption, "price" | "duration" | "departTime"> =
  {
    cheapest: "price",
    shortest: "duration",
    earliest: "departTime",
  };

@Component({
  selector: "app-flights",
  templateUrl: "./flights.component.html",
  styleUrl: "./flights.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightsComponent implements OnInit, OnDestroy {
  isSearched = false;
  isLoading = false;
  loadError = "";

  @ViewChildren(FlightsFiltersSidebarComponent)
  filterRefs!: QueryList<FlightsFiltersSidebarComponent>;

  @ViewChild("searchBarRef", { read: ElementRef }) searchBarRef!: ElementRef;

  // Mobile UX state
  isFilterDrawerOpen = false;
  showStickyCTA = false;

  // Discovery mode: shown when user hasn't searched yet
  isDiscoveryMode = true;
  discoveryFlights: FlightCardVM[] = [];

  // Fallback state: set when exact search had no results
  fallbackSearchLevel: 0 | 1 | 2 = 0;
  fallbackDateRange: { from: string; to: string } | null = null;

  searchCriteria: FlightSearchForm = {
    tripType: "oneWay",
    from: "",
    to: "",
    departDate: "",
    returnDate: "",
    passengers: { adults: 1, children: 0, seniors: 0 },
  };

  activeSort: FlightSortOption = "cheapest";

  selectedOutboundFlight: FlightCardVM | null = null;
  selectedReturnFlight: FlightCardVM | null = null;
  isBookingOpen = false;

  private rawOutboundFlights: Flight[] = [];
  private rawReturnFlights: Flight[] = [];

  displayFlights: FlightCardVM[] = [];
  displayReturnFlights: FlightCardVM[] = [];
  total = 0;
  returnTotal = 0;

  availableAirlines: string[] = [];

  activeFilters: FlightFilters = {
    maxPrice: 1500,
    maxDuration: 1440,
    stops: [],
    airlines: [],
    departureSlots: [],
    arrivalSlots: [],
    refundableOnly: false,
    baggageOnly: false,
  };

  private destroy$ = new Subject<void>();

  constructor(
    private translate: TranslateService,
    private flightService: FlightService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.queryParamMap.pipe(take(1)).subscribe((params) => {
      const from = params.get("from");
      const to = params.get("to");
      const date = params.get("date");
      const tripType = params.get("tripType") as "oneWay" | "roundTrip" | null;
      const returnDate = params.get("returnDate");

      const sortBy = params.get("sortBy") as FlightSortOption | null;
      if (sortBy) this.activeSort = sortBy;
      const maxPrice = params.get("maxPrice");
      if (maxPrice)
        this.activeFilters = { ...this.activeFilters, maxPrice: +maxPrice };
      const maxDuration = params.get("maxDuration");
      if (maxDuration)
        this.activeFilters = {
          ...this.activeFilters,
          maxDuration: +maxDuration,
        };
      const stops = params.get("stops");
      if (stops)
        this.activeFilters = {
          ...this.activeFilters,
          stops: stops.split(",").map(Number),
        };

      if (from && to && date) {
        this.searchCriteria = {
          ...this.searchCriteria,
          from,
          to,
          departDate: date,
          tripType: tripType || "oneWay",
          returnDate: returnDate || "",
        };
        this.isSearched = true;
        this.isDiscoveryMode = false;
        this.executeSearch();
      } else {
        this.loadDiscovery();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.style.overflow = "";
  }

  onSearch(criteria: FlightSearchForm) {
    this.loadError = "";

    if (
      criteria.from &&
      criteria.to &&
      criteria.from.toLowerCase() === criteria.to.toLowerCase()
    ) {
      this.loadError = this.translate.instant("flights.sameLocationError");
      this.cdr.markForCheck();
      return;
    }

    this.searchCriteria = { ...criteria };
    this.isSearched = true;
    this.isDiscoveryMode = false;
    this.fallbackSearchLevel = 0;
    this.fallbackDateRange = null;
    this.activeFilters = {
      maxPrice: 1500,
      maxDuration: 1440,
      stops: [],
      airlines: [],
      departureSlots: [],
      arrivalSlots: [],
      refundableOnly: false,
      baggageOnly: false,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        from: criteria.from,
        to: criteria.to,
        date: criteria.departDate,
        tripType: criteria.tripType,
        returnDate: criteria.returnDate || null,
      },
      queryParamsHandling: "merge",
    });

    this.executeSearch();
  }

  onSortChange(sort: FlightSortOption) {
    this.activeSort = sort;
    if (this.isSearched) {
      this.updateFilterUrlParams();
      this.executeSearch();
    }
  }

  onFiltersChange(filters: FlightFilters) {
    this.activeFilters = {
      ...filters,
      stops: [...filters.stops],
      airlines: [...filters.airlines],
      departureSlots: [...filters.departureSlots],
      arrivalSlots: [...filters.arrivalSlots],
    };
    if (this.isSearched) {
      this.updateFilterUrlParams();
      this.applyClientFilters();
    }
  }

  onSelectOutboundFlight(f: FlightCardVM) {
    this.selectedOutboundFlight = f;
    if (this.searchCriteria.tripType === "oneWay") {
      this.isBookingOpen = true;
      return;
    }
    if (this.selectedReturnFlight) {
      this.isBookingOpen = true;
    }
  }

  onSelectReturnFlight(f: FlightCardVM) {
    this.selectedReturnFlight = f;
    if (this.selectedOutboundFlight) {
      this.isBookingOpen = true;
    }
  }

  closeBooking() {
    this.isBookingOpen = false;
    this.selectedOutboundFlight = null;
    this.selectedReturnFlight = null;
  }

  get roundTripSelectionMessage(): string {
    if (this.searchCriteria.tripType !== "roundTrip") return "";
    if (!this.selectedOutboundFlight) {
      return this.translate.instant("flights.selectOutboundFirst");
    }
    if (!this.selectedReturnFlight) {
      return this.translate.instant("flights.outboundSelected");
    }
    return "";
  }

  get cheapestDiscoveryPrice(): number {
    return this.discoveryFlights.length
      ? Math.min(...this.discoveryFlights.map((f) => f.price))
      : Infinity;
  }

  discoveryBadge(f: FlightCardVM, index: number): string | null {
    if (index === 0) return "trending";
    if (f.price === this.cheapestDiscoveryPrice) return "best-price";
    if (f.stopsCount === 0 && index < 5) return "direct";
    if (f.isRefundable && f.hasBaggage && index < 8) return "all-included";
    if (index < 3) return "trending";
    return null;
  }

  discoveryBadgeLabel(badge: string | null): string {
    switch (badge) {
      case "trending":
        return "Trending";
      case "best-price":
        return "Best Price";
      case "direct":
        return "Direct";
      case "all-included":
        return "All Included";
      default:
        return "";
    }
  }

  get dateChips(): { date: string; dayLabel: string; fromPrice: number }[] {
    if (this.fallbackSearchLevel !== 1 || !this.rawOutboundFlights.length)
      return [];
    const byDate = new Map<string, number>();
    for (const f of this.rawOutboundFlights) {
      const d = String(f.departDate).split("T")[0];
      const cur = byDate.get(d);
      if (!cur || f.price < cur) byDate.set(d, f.price);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, fromPrice]) => ({
        date,
        dayLabel: new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        fromPrice,
      }));
  }

  onDateChipClick(date: string): void {
    this.searchCriteria = { ...this.searchCriteria, departDate: date };
    this.fallbackSearchLevel = 0;
    this.fallbackDateRange = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
    this.executeSearch();
  }

  onDiscoveryCardClick(f: FlightCardVM): void {
    this.isSearched = true;
    this.isDiscoveryMode = false;
    this.searchCriteria = {
      ...this.searchCriteria,
      from: f.from,
      to: f.to,
      departDate: "",
    };
    this.activeFilters = {
      maxPrice: 1500,
      maxDuration: 1440,
      stops: [],
      airlines: [],
      departureSlots: [],
      arrivalSlots: [],
      refundableOnly: false,
      baggageOnly: false,
    };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { from: f.from, to: f.to, date: null },
      queryParamsHandling: "merge",
    });
    this.executeSearch();
  }

  expandedFlightId: string | null = null;

  onExpandToggle(id: string): void {
    this.expandedFlightId = this.expandedFlightId === id ? null : id;
    this.cdr.markForCheck();
  }

  trackByFlight(_: number, flight: FlightCardVM): string {
    return flight.id;
  }

  get isFilterCaused(): boolean {
    return (
      this.rawOutboundFlights.length > 0 && this.displayFlights.length === 0
    );
  }

  onResetFilters(): void {
    this.filterRefs.forEach((r) => r.resetFilters());
  }

  openFilterDrawer(): void {
    this.isFilterDrawerOpen = true;
    document.body.style.overflow = "hidden";
    this.cdr.markForCheck();
  }

  closeFilterDrawer(): void {
    this.isFilterDrawerOpen = false;
    document.body.style.overflow = "";
    this.cdr.markForCheck();
  }

  scrollToSearchBar(): void {
    this.searchBarRef?.nativeElement?.scrollIntoView({ behavior: "smooth" });
  }

  @HostListener("window:scroll")
  onScroll(): void {
    if (!this.searchBarRef?.nativeElement) return;
    const bottom =
      this.searchBarRef.nativeElement.getBoundingClientRect().bottom;
    const was = this.showStickyCTA;
    this.showStickyCTA = bottom < 0;
    if (was !== this.showStickyCTA) this.cdr.markForCheck();
  }

  get activeFilterCount(): number {
    const f = this.activeFilters;
    let n = 0;
    if (f.maxPrice < 1500) n++;
    if (f.maxDuration < 1440) n++;
    if (f.stops.length) n++;
    if (f.airlines.length) n += f.airlines.length;
    if (f.departureSlots.length) n++;
    if (f.arrivalSlots.length) n++;
    if (f.refundableOnly) n++;
    if (f.baggageOnly) n++;
    return n;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private updateFilterUrlParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sortBy: this.activeSort,
        maxPrice:
          this.activeFilters.maxPrice < 1500
            ? this.activeFilters.maxPrice
            : null,
        maxDuration:
          this.activeFilters.maxDuration < 1440
            ? this.activeFilters.maxDuration
            : null,
        stops: this.activeFilters.stops.length
          ? this.activeFilters.stops.join(",")
          : null,
      },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  private loadDiscovery() {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.flightService
      .getDiscoveryFlights()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (flights) => {
          this.discoveryFlights = flights.map((f) => this.mapFlightToCardVM(f));
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          // Discovery failure is non-critical — just show empty state
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private extractCode(airportField: string): string {
    return airportField.split(" - ")[0].trim().toUpperCase();
  }

  private getTotalPassengers(): number {
    return (
      this.searchCriteria.passengers.adults +
      this.searchCriteria.passengers.children +
      this.searchCriteria.passengers.seniors
    );
  }

  private executeSearch() {
    this.isLoading = true;
    this.loadError = "";
    this.cdr.markForCheck();

    const requiredSeats = this.getTotalPassengers();
    const sortBy = SORT_MAP[this.activeSort];
    const fromCode = this.extractCode(this.searchCriteria.from);
    const toCode = this.extractCode(this.searchCriteria.to);

    const outbound$ = this.flightService.searchFlights({
      fromCode,
      toCode,
      departDate: this.searchCriteria.departDate,
      minAvailableSeats: requiredSeats,
      sortBy,
      limit: 100,
    });

    if (
      this.searchCriteria.tripType === "roundTrip" &&
      this.searchCriteria.returnDate
    ) {
      const return$ = this.flightService.searchFlights({
        fromCode: toCode,
        toCode: fromCode,
        departDate: this.searchCriteria.returnDate,
        minAvailableSeats: requiredSeats,
        sortBy,
        limit: 100,
      });

      forkJoin([outbound$, return$])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: ([outRes, retRes]) => {
            this.fallbackSearchLevel = outRes.searchLevel ?? 0;
            this.fallbackDateRange = outRes.dateRangeApplied ?? null;
            this.rawOutboundFlights = outRes.data;
            this.rawReturnFlights = retRes.data;
            this.total = outRes.total;
            this.returnTotal = retRes.total;
            this.availableAirlines = this.extractAirlines([
              ...outRes.data,
              ...retRes.data,
            ]);
            this.applyClientFilters();
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.loadError = this.translate.instant("flights.searchError");
            this.isLoading = false;
            this.cdr.markForCheck();
          },
        });
    } else {
      outbound$.pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.fallbackSearchLevel = res.searchLevel ?? 0;
          this.fallbackDateRange = res.dateRangeApplied ?? null;
          this.rawOutboundFlights = res.data;
          this.rawReturnFlights = [];
          this.total = res.total;
          this.returnTotal = 0;
          this.displayReturnFlights = [];
          this.availableAirlines = this.extractAirlines(res.data);
          this.applyClientFilters();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadError = this.translate.instant("flights.searchError");
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  private applyClientFilters() {
    this.displayFlights = this.filterFlights(this.rawOutboundFlights).map((f) =>
      this.mapFlightToCardVM(f),
    );
    this.displayReturnFlights = this.filterFlights(this.rawReturnFlights).map(
      (f) => this.mapFlightToCardVM(f),
    );
    this.cdr.markForCheck();
  }

  private filterFlights(flights: Flight[]): Flight[] {
    return flights.filter((f) => {
      if (f.price > this.activeFilters.maxPrice) return false;
      if (f.durationMinutes > this.activeFilters.maxDuration) return false;
      if (
        this.activeFilters.stops.length > 0 &&
        !this.activeFilters.stops.includes(f.stopsCount)
      )
        return false;
      if (
        this.activeFilters.airlines.length > 0 &&
        !this.activeFilters.airlines.includes(f.airline)
      )
        return false;
      const depSlot = this.getTimeSlot(f.departAt);
      if (
        this.activeFilters.departureSlots.length > 0 &&
        !this.activeFilters.departureSlots.includes(depSlot)
      )
        return false;
      const arrSlot = this.getTimeSlot(f.arriveAt);
      if (
        this.activeFilters.arrivalSlots.length > 0 &&
        !this.activeFilters.arrivalSlots.includes(arrSlot)
      )
        return false;
      if (this.activeFilters.refundableOnly && !f.isRefundable) return false;
      if (this.activeFilters.baggageOnly && !f.hasBaggage) return false;
      return true;
    });
  }

  private extractAirlines(flights: Flight[]): string[] {
    return [...new Set(flights.map((f) => f.airline))].sort();
  }

  private getTimeSlot(time: string): TimeSlot {
    const [h] = (time || "00:00").split(":").map(Number);
    const totalMinutes = h * 60;
    if (totalMinutes < 12 * 60) return "morning";
    if (totalMinutes < 18 * 60) return "afternoon";
    return "evening";
  }

  private mapFlightToCardVM(flight: Flight): FlightCardVM {
    return {
      id: flight.id,
      airline: flight.airline,
      from: flight.fromCode,
      to: flight.toCode,
      depart: flight.departAt,
      arrive: flight.arriveAt,
      stopsLabel:
        flight.stopsCount === 0
          ? "Közvetlen"
          : `${flight.stopsCount} átszállás`,
      duration: `${flight.durationMinutes} min`,
      price: flight.price,
      currency: flight.currency,
      stopsCount: flight.stopsCount,
      departureSlot: this.getTimeSlot(flight.departAt),
      arrivalSlot: this.getTimeSlot(flight.arriveAt),
      isRefundable: flight.isRefundable,
      hasBaggage: flight.hasBaggage,
      availableSeats: flight.availableSeats,
      departDate: String(flight.departDate ?? "").split("T")[0],
      fromLabel: flight.fromLabel,
      toLabel: flight.toLabel,
    };
  }
}
