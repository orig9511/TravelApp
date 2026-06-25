import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject, of } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
} from "rxjs/operators";

import {
  FlightService,
  AirportSuggestion,
} from "../../../../../services/flight.service";

export type FlightSearchForm = {
  tripType: "oneWay" | "roundTrip";
  from: string;
  to: string;
  departDate: string;
  returnDate: string;
  passengers: {
    adults: number;
    children: number;
    seniors: number;
  };
};

interface RecentSearch {
  from: string;
  to: string;
  departDate: string;
  tripType: "oneWay" | "roundTrip";
  returnDate: string;
  timestamp: number;
}

const RECENT_SEARCHES_KEY = "flight_recent_searches";
const RECENT_SEARCHES_MAX = 5;

@Component({
  selector: "app-flights-search-bar",
  templateUrl: "./flights-search-bar.component.html",
  styleUrls: ["./flights-search-bar.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightsSearchBarComponent implements OnInit, OnDestroy {
  @Output() search = new EventEmitter<FlightSearchForm>();

  constructor(
    private elementRef: ElementRef,
    private flightService: FlightService,
    private cdr: ChangeDetectorRef,
  ) {}

  from = "";
  to = "";
  tripType: "oneWay" | "roundTrip" = "oneWay";
  returnDate = "";
  departDate = "";
  passengers = { adults: 1, children: 0, seniors: 0 };
  isPassengersOpen = false;
  recentSearches: RecentSearch[] = [];

  // Autocomplete state
  fromSuggestions: AirportSuggestion[] = [];
  toSuggestions: AirportSuggestion[] = [];
  fromDropdownOpen = false;
  toDropdownOpen = false;
  activeFromIndex = -1;
  activeToIndex = -1;
  selectedFromCode: string | null = null;
  selectedToCode: string | null = null;
  isFromLoading = false;
  isToLoading = false;

  private fromInput$ = new Subject<string>();
  private toInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  popularAirports: AirportSuggestion[] = [
    { code: "BUD", label: "Budapest" },
    { code: "VIE", label: "Vienna" },
    { code: "LHR", label: "London Heathrow" },
    { code: "CDG", label: "Paris CDG" },
    { code: "FRA", label: "Frankfurt" },
    { code: "AMS", label: "Amsterdam" },
    { code: "BCN", label: "Barcelona" },
    { code: "IST", label: "Istanbul" },
  ];

  get totalPassengers() {
    return (
      this.passengers.adults +
      this.passengers.children +
      this.passengers.seniors
    );
  }

  minDate = this.getTodayDate();

  fromError = "";
  toError = "";
  dateError = "";
  returnDateError = "";
  passengersError = "";

  ngOnInit() {
    this.loadRecentSearches();

    this.fromInput$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) =>
          q.length >= 1 ? this.flightService.searchAirports(q) : of([]),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((results) => {
        this.fromSuggestions = results;
        this.isFromLoading = false;
        this.cdr.markForCheck();
      });

    this.toInput$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) =>
          q.length >= 1 ? this.flightService.searchAirports(q) : of([]),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((results) => {
        this.toSuggestions = results;
        this.isToLoading = false;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Autocomplete handlers ────────────────────────────────────────────────

  onFromInput(v: string): void {
    this.from = v;
    this.selectedFromCode = null;
    this.isFromLoading = true;
    this.fromDropdownOpen = true;
    this.fromInput$.next(v);
  }

  onToInput(v: string): void {
    this.to = v;
    this.selectedToCode = null;
    this.isToLoading = true;
    this.toDropdownOpen = true;
    this.toInput$.next(v);
  }

  onFromFocus(): void {
    this.fromDropdownOpen = true;
  }

  onToFocus(): void {
    this.toDropdownOpen = true;
  }

  selectSuggestion(s: AirportSuggestion, field: "from" | "to"): void {
    const display = `${s.code} - ${s.label}`;
    if (field === "from") {
      this.from = display;
      this.selectedFromCode = s.code;
      this.fromDropdownOpen = false;
      this.activeFromIndex = -1;
      this.fromError = "";
    } else {
      this.to = display;
      this.selectedToCode = s.code;
      this.toDropdownOpen = false;
      this.activeToIndex = -1;
      this.toError = "";
    }
    this.cdr.markForCheck();
  }

  closeDropdown(field: "from" | "to"): void {
    setTimeout(() => {
      if (field === "from") {
        this.fromDropdownOpen = false;
      } else {
        this.toDropdownOpen = false;
      }
      this.cdr.markForCheck();
    }, 150);
  }

  onKeydown(e: KeyboardEvent, field: "from" | "to"): void {
    const suggestions = this.getSuggestions(field);
    const isFrom = field === "from";
    const activeIndex = isFrom ? this.activeFromIndex : this.activeToIndex;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(activeIndex + 1, suggestions.length - 1);
      if (isFrom) this.activeFromIndex = next;
      else this.activeToIndex = next;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(activeIndex - 1, -1);
      if (isFrom) this.activeFromIndex = prev;
      else this.activeToIndex = prev;
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      this.selectSuggestion(suggestions[activeIndex], field);
    } else if (e.key === "Escape") {
      if (isFrom) {
        this.fromDropdownOpen = false;
        this.activeFromIndex = -1;
      } else {
        this.toDropdownOpen = false;
        this.activeToIndex = -1;
      }
    }
  }

  getSuggestions(field: "from" | "to"): AirportSuggestion[] {
    const suggestions =
      field === "from" ? this.fromSuggestions : this.toSuggestions;
    const query = field === "from" ? this.from : this.to;
    return suggestions.length > 0
      ? suggestions
      : query.length === 0
        ? this.popularAirports
        : [];
  }

  // ─── Search ───────────────────────────────────────────────────────────────

  getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  onSearch() {
    this.fromError = "";
    this.toError = "";
    this.dateError = "";
    this.returnDateError = "";
    this.passengersError = "";

    const trimmedFrom = this.from.trim();
    const trimmedTo = this.to.trim();

    if (!trimmedFrom) {
      this.fromError = "Add meg az indulási repteret.";
    } else if (!this.selectedFromCode) {
      this.fromError = "Válassz egy érvényes indulási repteret a listából.";
    }

    if (!trimmedTo) {
      this.toError = "Add meg az érkezési repteret.";
    } else if (!this.selectedToCode) {
      this.toError = "Válassz egy érvényes érkezési repteret a listából.";
    }

    if (!this.departDate) {
      this.dateError = "Add meg az indulás dátumát.";
    } else if (this.departDate < this.minDate) {
      this.dateError = "Az indulás dátuma nem lehet korábbi a mai napnál.";
    }

    if (this.tripType === "roundTrip") {
      if (!this.returnDate) {
        this.returnDateError = "Add meg a visszaút dátumát.";
      } else if (this.returnDate < this.departDate) {
        this.returnDateError =
          "A visszaút dátuma nem lehet korábbi az indulás dátumánál.";
      }
    }

    if (
      this.fromError ||
      this.toError ||
      this.dateError ||
      this.returnDateError ||
      this.passengersError
    ) {
      return;
    }

    const normalizedPassengers = {
      adults: Math.max(0, Number(this.passengers.adults) || 0),
      children: Math.max(0, Number(this.passengers.children) || 0),
      seniors: Math.max(0, Number(this.passengers.seniors) || 0),
    };
    this.passengers = normalizedPassengers;

    if (normalizedPassengers.adults + normalizedPassengers.seniors < 1) {
      this.passengersError =
        "Legalább 1 felnőtt vagy nyugdíjas utast meg kell adni.";
      return;
    }

    const form: FlightSearchForm = {
      tripType: this.tripType,
      from: trimmedFrom,
      to: trimmedTo,
      departDate: this.departDate,
      returnDate: this.returnDate,
      passengers: normalizedPassengers,
    };

    this.saveRecentSearch(form);
    this.search.emit(form);
  }

  applyRecentSearch(recent: RecentSearch) {
    this.from = recent.from;
    this.to = recent.to;
    this.departDate = recent.departDate;
    this.tripType = recent.tripType;
    this.returnDate = recent.returnDate;
    // Extract codes from display labels (format: "BUD - Budapest")
    this.selectedFromCode = recent.from.split(" - ")[0].trim();
    this.selectedToCode = recent.to.split(" - ")[0].trim();
    this.search.emit({
      tripType: recent.tripType,
      from: recent.from,
      to: recent.to,
      departDate: recent.departDate,
      returnDate: recent.returnDate,
      passengers: this.passengers,
    });
  }

  decreasePassengers(type: "adults" | "children" | "seniors") {
    this.passengers[type] = Math.max(0, this.passengers[type] - 1);
  }

  increasePassengers(type: "adults" | "children" | "seniors") {
    this.passengers[type] = this.passengers[type] + 1;
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.isPassengersOpen = false;
      this.fromDropdownOpen = false;
      this.toDropdownOpen = false;
    }
  }

  trackByAirport(_: number, airport: AirportSuggestion): string {
    return airport.code;
  }

  trackByRecent(_: number, r: RecentSearch): number {
    return r.timestamp;
  }

  // ─── Recent searches ──────────────────────────────────────────────────────

  private loadRecentSearches() {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      this.recentSearches = raw ? (JSON.parse(raw) as RecentSearch[]) : [];
    } catch {
      this.recentSearches = [];
    }
  }

  private saveRecentSearch(form: FlightSearchForm) {
    const entry: RecentSearch = {
      from: form.from,
      to: form.to,
      departDate: form.departDate,
      tripType: form.tripType,
      returnDate: form.returnDate,
      timestamp: Date.now(),
    };
    const filtered = this.recentSearches.filter(
      (r) =>
        !(
          r.from === entry.from &&
          r.to === entry.to &&
          r.departDate === entry.departDate
        ),
    );
    this.recentSearches = [entry, ...filtered].slice(0, RECENT_SEARCHES_MAX);
    try {
      localStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(this.recentSearches),
      );
    } catch {
      // localStorage unavailable — silently ignore
    }
  }
}
