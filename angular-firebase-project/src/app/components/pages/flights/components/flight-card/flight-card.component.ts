import { Component, Input, Output, EventEmitter } from "@angular/core";
import { FlightCardVM } from "../../flight-models/flight-card-vm.model";

@Component({
  selector: "app-flight-card",
  templateUrl: "./flight-card.component.html",
  styleUrls: ["./flight-card.component.scss"],
})
export class FlightCardComponent {
  @Input() flight!: FlightCardVM;
  @Input() isExpanded = false;
  @Input() passengers = {
    adults: 1,
    children: 0,
    seniors: 0,
  };

  @Output() viewPrices = new EventEmitter<FlightCardVM>();
  @Output() expandToggle = new EventEmitter<string>();

  get totalPassengers() {
    return (
      this.passengers.adults +
      this.passengers.children +
      this.passengers.seniors
    );
  }

  get totalPrice() {
    return (this.flight?.price || 0) * this.totalPassengers;
  }

  get pricePerAdult(): number {
    return this.flight?.price ?? 0;
  }

  onExpandClick(): void {
    this.expandToggle.emit(this.flight.id);
  }

  onBookClick(): void {
    this.viewPrices.emit(this.flight);
  }
}
