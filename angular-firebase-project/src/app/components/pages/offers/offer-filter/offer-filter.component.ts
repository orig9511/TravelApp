import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { OfferFilterState } from "../../../../models/offerfilterstate.model";

@Component({
  selector: "app-offer-filter",
  templateUrl: "./offer-filter.component.html",
  styleUrls: ["./offer-filter.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferFilterComponent {
  @Output() filterChanged = new EventEmitter<OfferFilterState>();

  @Input() resultCount: number | null = null;
  filter: OfferFilterState = {};

  applyFilter() {
    this.filterChanged.emit({ ...this.filter });
  }

  reset(): void {
    this.filter = {};
    this.filterChanged.emit({});
  }

  hasActiveFilters(): boolean {
    return Object.values(this.filter).some((v) => v !== undefined && v !== "");
  }

  trackByIndex(index: number): number {
    return index;
  }
}
