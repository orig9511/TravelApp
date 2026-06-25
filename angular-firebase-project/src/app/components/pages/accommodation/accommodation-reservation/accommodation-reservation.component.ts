import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { LodgingService } from "../../../../services/lodging.service";
import { ReservationService } from "../../../../services/reservation.service";
import { AccommodationModel } from "../../../../models/lodging.model";
import { NotificationService } from "../../../../services/notification.service";

@Component({
  selector: "app-accommodation-reservation",
  templateUrl: "./accommodation-reservation.component.html",
  styleUrl: "./accommodation-reservation.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccommodationReservationComponent implements OnInit, OnDestroy {
  accommodationId = "";
  accommodation: AccommodationModel | null = null;

  startDate = "";
  endDate = "";
  persons = 1;

  loading = true;
  submitting = false;
  successMessage = "";
  errorMessage = "";

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lodgingService: LodgingService,
    private reservationService: ReservationService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");

    if (!id) {
      this.loading = false;
      this.errorMessage = "Hiányzó szállás azonosító";
      this.cdr.markForCheck();
      return;
    }

    this.accommodationId = id;

    const state = history.state;
    if (state?.startDate) this.startDate = state.startDate;
    if (state?.endDate) this.endDate = state.endDate;
    if (state?.persons) this.persons = Number(state.persons);

    this.lodgingService
      .getAccommodationById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (accommodation) => {
          this.accommodation = accommodation;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.errorMessage = "Nem sikerült betölteni a szállás adatait";
          this.cdr.markForCheck();
        },
      });
  }

  get minCheckin(): string {
    return new Date().toISOString().split("T")[0];
  }

  get minCheckout(): string {
    if (!this.startDate) return "";
    const next = new Date(this.startDate);
    next.setDate(next.getDate() + 1);
    return next.toISOString().split("T")[0];
  }

  get totalPrice(): number {
    if (!this.accommodation) {
      return 0;
    }

    const nights = this.getNightsCount();
    return this.accommodation.price * this.persons * nights;
  }

  getNightsCount(): number {
    if (!this.startDate || !this.endDate) {
      return 0;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diff = end.getTime() - start.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return days > 0 ? days : 0;
  }

  submitReservation(): void {
    this.errorMessage = "";
    this.successMessage = "";

    if (!this.startDate || !this.endDate) {
      this.errorMessage = "Kérjük, add meg az érkezés és távozás dátumát";
      this.cdr.markForCheck();
      return;
    }

    const nights = this.getNightsCount();
    if (nights < 1) {
      this.errorMessage =
        "A távozás dátuma későbbi kell legyen, mint az érkezés";
      this.cdr.markForCheck();
      return;
    }

    const payload = {
      accommodationId: this.accommodationId,
      startDate: this.startDate,
      endDate: this.endDate,
      persons: this.persons,
      price: this.totalPrice,
    };

    this.submitting = true;
    this.cdr.markForCheck();

    this.reservationService
      .createReservation(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = "A foglalás sikeresen létrejött.";
          this.submitting = false;
          this.notificationService.refresh();
          this.cdr.markForCheck();
        },
        error: (err) => {
          const validationDetails = err?.error?.message;
          console.error(
            "[AccommodationReservation] backend validation error:",
            validationDetails,
          );

          const exactDtoFail = Array.isArray(validationDetails)
            ? validationDetails.join("; ")
            : validationDetails || err?.error?.error || err?.message;

          this.errorMessage = `Foglalás sikertelen: ${exactDtoFail}`;
          this.submitting = false;
          this.cdr.markForCheck();
        },
      });
  }

  backToAccommodation(): void {
    if (this.accommodationId) {
      this.router.navigate(["/accommodation", this.accommodationId]);
      return;
    }

    this.router.navigate(["/accommodation"]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
