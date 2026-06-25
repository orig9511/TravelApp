import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FlightCardVM } from "../../flight-models/flight-card-vm.model";

@Component({
  selector: "app-flights-results-list",
  templateUrl: "./flights-results-list.component.html",
  styleUrls: ["./flights-results-list.component.scss"],
})
export class FlightsResultsListComponent {
  @Input() flights: FlightCardVM[] = [];
  @Input() passengers = {
    adults: 1,
    children: 0,
    seniors: 0,
  };
  @Input() expandedFlightId: string | null = null;

  @Output() selectFlight = new EventEmitter<FlightCardVM>();
  @Output() expandToggle = new EventEmitter<string>();

  onCardViewPrices(f: FlightCardVM) {
    this.selectFlight.emit(f);
  }

  onCardExpandToggle(id: string) {
    this.expandToggle.emit(id);
  }

  trackByFlight(_: number, flight: FlightCardVM): string {
    return flight.id;
  }
}
