import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { Offer } from "../../../../models/offer.model";
import { OfferAnalytics } from "../../../../models/offer-analytics.model";

@Component({
  selector: "app-offer-details-modal",
  templateUrl: "./offer-details-modal.component.html",
  styleUrl: "./offer-details-modal.component.scss",
  standalone: true,
  imports: [CommonModule, TranslateModule],
})
export class OfferDetailsModalComponent {
  @Input() offer: Offer | null = null;
  @Input() analytics: OfferAnalytics | null = null;
  @Input() show = false;
  @Output() closeModal = new EventEmitter<void>();

  close(): void {
    this.closeModal.emit();
  }

  formatCurrency(value: number): string {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "0";
    }

    if (Number.isInteger(numeric)) {
      return String(numeric);
    }

    return numeric.toFixed(2).replace(/\.?0+$/, "");
  }

  formatPercent(value: number): string {
    return value.toFixed(1);
  }
}
