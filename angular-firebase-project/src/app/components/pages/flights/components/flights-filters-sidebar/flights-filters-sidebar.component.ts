import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { TimeSlot } from "../../flight-models/flight-card-vm.model";

export type FlightFilters = {
  maxPrice: number;
  maxDuration: number;
  stops: number[];
  airlines: string[];
  departureSlots: TimeSlot[];
  arrivalSlots: TimeSlot[];
  refundableOnly: boolean;
  baggageOnly: boolean;
};

@Component({
  selector: "app-flights-filters-sidebar",
  templateUrl: "./flights-filters-sidebar.component.html",
  styleUrl: "./flights-filters-sidebar.component.scss",
})
export class FlightsFiltersSidebarComponent implements OnInit {
  @Input() availableAirlines: string[] = [];
  @Input() set initialFilters(f: Partial<FlightFilters> | null) {
    if (f) {
      this.filters = { ...this.filters, ...f };
    }
  }
  @Output() filtersChange = new EventEmitter<FlightFilters>();

  private sliderSubject = new Subject<void>();

  filters: FlightFilters = {
    maxPrice: 1500,
    maxDuration: 1440,
    stops: [],
    airlines: [],
    departureSlots: [],
    arrivalSlots: [],
    refundableOnly: false,
    baggageOnly: false,
  };

  // Track which sections are collapsed
  collapsed: Record<string, boolean> = {
    price: false,
    stops: false,
    airline: false,
    departure: false,
    arrival: true,
    extras: false,
  };

  ngOnInit() {
    this.sliderSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.emitFilters());
  }

  get airlineList(): string[] {
    return this.availableAirlines;
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.filters.maxPrice < 1500) count++;
    if (this.filters.maxDuration < 1440) count++;
    if (this.filters.stops.length > 0) count++;
    if (this.filters.airlines.length > 0) count += this.filters.airlines.length;
    if (this.filters.departureSlots.length > 0) count++;
    if (this.filters.arrivalSlots.length > 0) count++;
    if (this.filters.refundableOnly) count++;
    if (this.filters.baggageOnly) count++;
    return count;
  }

  toggleSection(key: string) {
    this.collapsed[key] = !this.collapsed[key];
  }

  toggleArrayValue<T>(
    key: "stops" | "airlines" | "departureSlots" | "arrivalSlots",
    value: T,
  ) {
    const list = this.filters[key] as T[];
    const contains = list.includes(value);
    this.filters = {
      ...this.filters,
      [key]: contains
        ? list.filter((item) => item !== value)
        : [...list, value],
    };
    this.emitFilters();
  }

  onPriceChange(value: string) {
    const parsed = Number(value);
    this.filters = {
      ...this.filters,
      maxPrice: Number.isFinite(parsed) ? parsed : 1500,
    };
    this.sliderSubject.next();
  }

  onDurationChange(value: string) {
    const parsed = Number(value);
    this.filters = {
      ...this.filters,
      maxDuration: Number.isFinite(parsed) ? parsed : 1440,
    };
    this.sliderSubject.next();
  }

  onBooleanChange(key: "refundableOnly" | "baggageOnly", event: Event) {
    const input = event.target as HTMLInputElement;
    this.filters = { ...this.filters, [key]: input.checked };
    this.emitFilters();
  }

  emitFilters() {
    this.filtersChange.emit({ ...this.filters });
  }

  resetFilters() {
    this.filters = {
      maxPrice: 1500,
      maxDuration: 1440,
      stops: [],
      airlines: [],
      departureSlots: [],
      arrivalSlots: [],
      refundableOnly: false,
      baggageOnly: false,
    };
    this.emitFilters();
  }

  trackByAirline(_: number, airline: string): string {
    return airline;
  }
}
