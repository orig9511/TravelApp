import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AuthService } from "../../../../../services/auth.service";
import { FlightCardVM } from "../../flight-models/flight-card-vm.model";
import { BookingService } from "../../../../../services/booking.service";

@Component({
  selector: "app-flights-booking-modal",
  templateUrl: "./flights-booking-modal.component.html",
  styleUrl: "./flights-booking-modal.component.scss",
})
export class FlightsBookingModalComponent implements OnInit, OnDestroy {
  @Input() outboundFlight: FlightCardVM | null = null;
  @Input() returnFlight: FlightCardVM | null = null;

  @Input() passengers!: {
    adults: number;
    children: number;
    seniors: number;
  };

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.currentUserId = user?.id || null;
    });
  }

  get isRoundTrip() {
    return !!this.returnFlight;
  }

  get totalPassengers() {
    return (
      this.passengers.adults +
      this.passengers.children +
      this.passengers.seniors
    );
  }

  get outboundPrice() {
    return this.outboundFlight?.price || 0;
  }

  get returnPrice() {
    return this.returnFlight?.price || 0;
  }

  get basePrice() {
    return (this.outboundPrice + this.returnPrice) * this.totalPassengers;
  }

  get totalPrice() {
    return this.basePrice + this.baggagePrice;
  }

  get baggagePrice() {
    return this.baggageCounts.checked * 25 + this.baggageCounts.priority * 45;
  }

  get baggageLabel() {
    const labels: string[] = [];

    if (this.baggageCounts.cabin > 0) {
      labels.push(`${this.baggageCounts.cabin} kézipoggyász`);
    }

    if (this.baggageCounts.checked > 0) {
      labels.push(`${this.baggageCounts.checked} feladott poggyász`);
    }

    if (this.baggageCounts.priority > 0) {
      labels.push(
        `${this.baggageCounts.priority} elsőbbségi beszállás + poggyász`,
      );
    }

    if (labels.length === 0) {
      return "Nincs kiválasztott poggyász";
    }

    return labels.join(", ");
  }

  get passengersSummary() {
    const parts = [];

    if (this.passengers.adults > 0) {
      parts.push(`${this.passengers.adults} felnőtt`);
    }

    if (this.passengers.children > 0) {
      parts.push(`${this.passengers.children} gyerek`);
    }

    if (this.passengers.seniors > 0) {
      parts.push(`${this.passengers.seniors} nyugdíjas`);
    }

    return parts.join(", ");
  }

  @Output() close = new EventEmitter<void>();

  lastName = "";
  firstName = "";
  email = "";
  phone = "";

  lastNameError = "";
  firstNameError = "";
  emailError = "";
  phoneError = "";

  bookingSuccess = false;
  isSubmitting = false;
  bookingError = "";
  baggageCounts = {
    cabin: 0,
    checked: 0,
    priority: 0,
  };
  isBaggageOpen = false;

  currentUserId: string | null = null;
  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async onBook() {
    this.lastNameError = "";
    this.firstNameError = "";
    this.emailError = "";
    this.phoneError = "";
    this.bookingError = "";
    this.isSubmitting = true;

    if (!this.currentUserId) {
      this.bookingError = "A foglaláshoz be kell jelentkezni.";
      this.isSubmitting = false;
      return;
    }

    const trimmedLastName = this.lastName.trim();
    const trimmedFirstName = this.firstName.trim();
    const trimmedEmail = this.email.trim();
    const trimmedPhone = this.phone.trim();
    const digitsOnlyPhone = trimmedPhone.replace(/\D/g, "");

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\+?[0-9\s\-()]{7,20}$/;

    if (!trimmedLastName) {
      this.lastNameError = "Add meg a vezetéknevet.";
    } else if (trimmedLastName.length < 3) {
      this.lastNameError = "A vezetéknév legalább 3 karakter legyen.";
    }

    if (!trimmedFirstName) {
      this.firstNameError = "Add meg a keresztnevet.";
    } else if (trimmedFirstName.length < 3) {
      this.firstNameError = "A keresztnév legalább 3 karakter legyen.";
    }

    if (!trimmedEmail) {
      this.emailError = "Add meg az email címet.";
    } else if (!emailPattern.test(trimmedEmail)) {
      this.emailError = "Adj meg egy érvényes email címet.";
    }

    if (!trimmedPhone) {
      this.phoneError = "Add meg a telefonszámot.";
    } else if (
      !phonePattern.test(trimmedPhone) ||
      digitsOnlyPhone.length < 7 ||
      digitsOnlyPhone.length > 15
    ) {
      this.phoneError = "Adj meg egy érvényes telefonszámot.";
    }

    if (
      this.lastNameError ||
      this.firstNameError ||
      this.emailError ||
      this.phoneError
    ) {
      this.isSubmitting = false;
      return;
    }

    this.lastName = trimmedLastName;
    this.firstName = trimmedFirstName;
    this.email = trimmedEmail;
    this.phone = trimmedPhone;

    try {
      const booking = this.buildBookingPayload();
      await this.bookingService.createFlightBooking(booking);
      this.bookingSuccess = true;
    } catch (error) {
      console.error("Booking save error:", error);
      this.bookingError = "A foglalás mentése nem sikerült. Próbáld újra.";
    } finally {
      this.isSubmitting = false;
    }
  }

  private buildBookingPayload() {
    const safeOutboundId = this.outboundFlight?.id;
    if (!safeOutboundId) {
      throw new Error("Hiányzó outbound flight azonosító");
    }

    return {
      outboundFlightId: safeOutboundId,
      returnFlightId: this.returnFlight?.id,
      quantity: this.totalPassengers,
      contact: {
        lastName: this.lastName,
        firstName: this.firstName,
        email: this.email,
        phone: this.phone,
      },
      baggage: {
        cabin: this.baggageCounts.cabin,
        checked: this.baggageCounts.checked,
        priority: this.baggageCounts.priority,
      },
      idempotencyKey: `flight-${Date.now()}-${this.currentUserId}`,
    };
  }

  decreaseBaggage(type: "cabin" | "checked" | "priority") {
    this.baggageCounts[type] = Math.max(0, this.baggageCounts[type] - 1);
  }

  increaseBaggage(type: "cabin" | "checked" | "priority") {
    const maxCount = type === "cabin" ? 1 : this.totalPassengers;

    if (this.baggageCounts[type] >= maxCount) {
      return;
    }

    this.baggageCounts[type] = this.baggageCounts[type] + 1;
  }
}
