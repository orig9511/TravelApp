import { Component, EventEmitter, Input, Output } from "@angular/core";

export type FlightSortOption = "cheapest" | "shortest" | "earliest";

@Component({
  selector: "app-flights-sort-bar",
  templateUrl: "./flights-sort-bar.component.html",
  styleUrls: ["./flights-sort-bar.component.scss"],
})
export class FlightsSortBarComponent {
  @Output() sortChange = new EventEmitter<FlightSortOption>();

  selectedSort: FlightSortOption = "cheapest";

  @Input() set activeSort(s: FlightSortOption) {
    if (s && s !== this.selectedSort) {
      this.selectedSort = s;
    }
  }

  onSortChange(value: string) {
    this.selectedSort = value as FlightSortOption;
    this.sortChange.emit(this.selectedSort);
  }
}
