import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AccommodationService } from "../../../../services/accommodation.service";
import { ImageUploadService } from "../../../../services/image-upload.service";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-accommodation-register",
  templateUrl: "./accommodation-register.component.html",
  styleUrls: ["./accommodation-register.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccommodationRegisterComponent implements OnInit {
  accommodationForm!: FormGroup;
  isSubmitting = false;
  errorMessage = "";
  successMessage = "";
  imageUploadLoading = false;
  imagePreviewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private accommodationService: AccommodationService,
    private imageUploadService: ImageUploadService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.accommodationForm = this.fb.group({
      imageUrl: ["", Validators.required],
      name: ["", Validators.required],
      type: ["", Validators.required],
      pricePerNight: [null, [Validators.required, Validators.min(1)]],
      mobile: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      roomCount: [null],
      description: ["", Validators.required],
      continent: ["", Validators.required],
      country: ["", Validators.required],
      city: ["", Validators.required],
      address: ["", Validators.required],
      services: ["", Validators.required],
    });
  }

  async onFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.imageUploadLoading = true;
    this.errorMessage = "";
    this.cdr.markForCheck();

    try {
      const url = await firstValueFrom(
        this.imageUploadService.uploadImage(file, "accommodations"),
      );
      this.accommodationForm.patchValue({ imageUrl: url });
      this.imagePreviewUrl = url;
    } catch (err: any) {
      this.errorMessage =
        "Képfeltöltési hiba: " + (err?.message ?? "ismeretlen hiba");
    } finally {
      this.imageUploadLoading = false;
      this.cdr.markForCheck();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.accommodationForm.invalid) {
      this.accommodationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = "";
    this.successMessage = "";
    this.cdr.markForCheck();

    try {
      const formValue = this.accommodationForm.value;

      const accommodation = {
        ...formValue,
        roomCount: formValue.roomCount ? Number(formValue.roomCount) : 0,
        pricePerNight: Number(formValue.pricePerNight),
        availablePlaces: 0,
        capacityPerAccommodation: 0,
        rating: 0,
        stars: 0,
        services: formValue.services
          .split(",")
          .map((service: string) => service.trim())
          .filter((service: string) => service.length > 0),
      };

      await this.accommodationService.addAccommodation(accommodation);

      this.successMessage = "A szállás sikeresen mentve lett.";
      this.accommodationForm.reset();

      setTimeout(() => {
        this.router.navigate(["/accommodation"]);
      }, 1000);
    } catch (error) {
      console.error(error);
      this.errorMessage = "Hiba történt mentés közben.";
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }
}
