import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { AccommodationService } from "../../../services/accommodation.service";
import { Accommodation } from "../../../models/accommodation.model";

type FormData = Omit<Accommodation, "id" | "user_id">;

const EMPTY_FORM: FormData = {
  imageUrl: "",
  name: "",
  type: "",
  pricePerNight: 0,
  availablePlaces: 0,
  mobile: "",
  email: "",
  roomCount: 1,
  capacityPerAccommodation: 2,
  rating: 0,
  stars: 3,
  description: "",
  continent: "",
  country: "",
  city: "",
  address: "",
  comment: "",
  services: [],
};

@Component({
  selector: "app-accommodation-management",
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: "./accommodation-management.component.html",
  styleUrl: "./accommodation-management.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccommodationManagementComponent implements OnInit, OnDestroy {
  accommodations: Accommodation[] = [];
  loading = true;
  error: string | null = null;

  showModal = false;
  editingId: string | null = null;
  viewMode = false;
  form: FormData = { ...EMPTY_FORM };
  submitting = false;
  formError: string | null = null;

  deleteConfirmId: string | null = null;
  deleting = false;

  servicesInput = "";

  private destroy$ = new Subject<void>();

  constructor(
    private accommodationService: AccommodationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAccommodations();
  }

  loadAccommodations(): void {
    this.loading = true;
    this.error = null;

    this.accommodationService
      .getAccommodations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.accommodations = list;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = "Hiba történt a szállások betöltésekor";
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  openViewModal(acc: Accommodation): void {
    this.viewMode = true;
    this.editingId = acc.id ?? null;
    this.form = {
      imageUrl: acc.imageUrl,
      name: acc.name,
      type: acc.type,
      pricePerNight: acc.pricePerNight,
      availablePlaces: acc.availablePlaces,
      mobile: acc.mobile,
      email: acc.email,
      roomCount: acc.roomCount ?? 1,
      capacityPerAccommodation: acc.capacityPerAccommodation,
      rating: acc.rating,
      stars: acc.stars,
      description: acc.description,
      continent: acc.continent,
      country: acc.country,
      city: acc.city,
      address: acc.address,
      comment: acc.comment ?? "",
      services: [...(acc.services ?? [])],
    };
    this.servicesInput = (acc.services ?? []).join(", ");
    this.formError = null;
    this.showModal = true;
    this.cdr.markForCheck();
  }

  openEditModal(acc: Accommodation): void {
    this.viewMode = false;
    this.editingId = acc.id ?? null;
    this.form = {
      imageUrl: acc.imageUrl,
      name: acc.name,
      type: acc.type,
      pricePerNight: acc.pricePerNight,
      availablePlaces: acc.availablePlaces,
      mobile: acc.mobile,
      email: acc.email,
      roomCount: acc.roomCount ?? 1,
      capacityPerAccommodation: acc.capacityPerAccommodation,
      rating: acc.rating,
      stars: acc.stars,
      description: acc.description,
      continent: acc.continent,
      country: acc.country,
      city: acc.city,
      address: acc.address,
      comment: acc.comment ?? "",
      services: [...(acc.services ?? [])],
    };
    this.servicesInput = (acc.services ?? []).join(", ");
    this.formError = null;
    this.showModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
    this.viewMode = false;
    this.cdr.markForCheck();
  }

  onServicesChange(): void {
    this.form.services = this.servicesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  submitForm(): void {
    if (this.viewMode) {
      this.closeModal();
      return;
    }

    if (!this.form.name?.trim()) {
      this.formError = "A szálláshely neve kötelező";
      return;
    }

    if (!this.editingId) return;

    this.submitting = true;
    this.formError = null;

    this.accommodationService
      .updateAccommodation(this.editingId, { ...this.form })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.showModal = false;
          this.loadAccommodations();
        },
        error: (err) => {
          this.formError = err?.error?.message ?? "Hiba történt a mentés során";
          this.submitting = false;
          this.cdr.markForCheck();
        },
      });
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId = id;
    this.cdr.markForCheck();
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
    this.cdr.markForCheck();
  }

  executeDelete(id: string): void {
    this.deleting = true;

    this.accommodationService
      .deleteAccommodation(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting = false;
          this.deleteConfirmId = null;
          this.accommodations = this.accommodations.filter((a) => a.id !== id);
          this.cdr.markForCheck();
        },
        error: () => {
          this.deleting = false;
          this.deleteConfirmId = null;
          this.error = "Hiba történt a törlés során";
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByAccommodationId(_: number, acc: Accommodation): string {
    return acc.id ?? acc.name;
  }

  trackByValue(_: number, value: string): string {
    return value;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
