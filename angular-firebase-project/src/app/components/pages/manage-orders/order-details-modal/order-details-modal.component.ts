import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { IsoDatePipe } from "../../../../shared/pipes/iso-date.pipe";
import { EnrichedBooking } from "../manage-orders.component";

@Component({
  selector: "app-order-details-modal",
  templateUrl: "./order-details-modal.component.html",
  styleUrls: ["./order-details-modal.component.scss"],
  standalone: true,
  imports: [CommonModule, TranslateModule, IsoDatePipe],
})
export class OrderDetailsModalComponent {
  @Input() booking: EnrichedBooking | null = null;
  @Input() show = false;
  @Output() closeModal = new EventEmitter<void>();

  close(): void {
    this.closeModal.emit();
  }

  getTotalExtrasPrice(): number {
    if (!this.booking?.extras) return 0;
    return (
      (this.booking.extras.extraBaggage || 0) * 50 +
      (this.booking.extras.extraLegroom || 0) * 30
    );
  }

  trackByIndex(index: number): number {
    return index;
  }
}
