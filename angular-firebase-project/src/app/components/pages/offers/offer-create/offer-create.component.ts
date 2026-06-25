import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { OfferService } from "../../../../services/offer.service";
import { OfferInstanceService } from "../../../../services/offer-instance.service";
import { ImageUploadService } from "../../../../services/image-upload.service";
import { Offer } from "../../../../models/offer.model";
import { firstValueFrom, Subject, takeUntil } from "rxjs";

@Component({
  selector: "app-offer-create",
  styleUrls: ["./offer-create.component.scss"],
  templateUrl: "./offer-create.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferCreateComponent implements OnInit, OnDestroy {
  offer!: Offer;
  saving = false;
  isEditMode = false;

  continents = [
    "Europe",
    "Asia",
    "Africa",
    "North America",
    "South America",
    "Australia",
  ];

  // ─── Instance state ──────────────────────────────────────────────────────
  instances: {
    departureDate: string;
    returnDate: string;
    pricePerPerson: number;
    capacity: number;
    extraBaggageCapacity: number;
    extraLegroomCapacity: number;
    // Flight data per instance
    flight?: {
      outbound: {
        airline: string;
        flightNumber: string;
        from: string;
        to: string;
        departureTime: string;
        arrivalTime: string;
        durationMinutes: number;
      };
      return?: {
        airline: string;
        flightNumber: string;
        from: string;
        to: string;
        departureTime: string;
        arrivalTime: string;
        durationMinutes: number;
      };
      aircraft?: string;
    };
  }[] = [];

  private destroy$ = new Subject<void>();

  // Image upload state
  imageUploadLoading = false;
  imageUploadError: string | null = null;
  imagePreviewUrls: string[] = [];

  constructor(
    private offerService: OfferService,
    private offerInstanceService: OfferInstanceService,
    private imageUploadService: ImageUploadService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");

    if (id) {
      // ✏️ EDIT MÓD
      this.isEditMode = true;

      this.offerService
        .getOfferById(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (offer) => {
            if (!offer) return;
            this.offer = { ...offer, id };
            if ((this.offer.travelCategory as string) === "domestic") {
              this.offer.travelCategory = "individual";
            }
            this.imagePreviewUrls = [...(this.offer.images || [])];
            this.cdr.markForCheck();
          },
          error: (err) => console.error("Edit betöltési hiba:", err),
        });
    } else {
      // ➕ CREATE MÓD
      this.offer = this.createEmptyOffer();
    }
  }

  get needsFlightFields(): boolean {
    return (
      this.offer?.travelCategory === "flight" ||
      this.offer?.travelCategory === "tour"
    );
  }

  get datesValid(): boolean {
    if (!this.offer?.travelPeriodStart || !this.offer?.travelPeriodEnd)
      return true;
    return this.offer.travelPeriodStart <= this.offer.travelPeriodEnd;
  }

  recalcInstanceReturnDate(inst: any): void {
    if (!inst.departureDate || !this.offer?.days) return;
    const [y, m, d] = inst.departureDate.split("-").map(Number);
    const utc = new Date(Date.UTC(y, m - 1, d));
    if (isNaN(utc.getTime())) return;
    utc.setUTCDate(utc.getUTCDate() + Number(this.offer.days));
    inst.returnDate = utc.toISOString().slice(0, 10);
  }

  get instancesValid(): boolean {
    return this.instances.every(
      (inst) =>
        !!inst.departureDate &&
        !!inst.returnDate &&
        inst.returnDate > inst.departureDate &&
        inst.pricePerPerson > 0 &&
        inst.capacity > 0,
    );
  }

  addInstance(): void {
    const newInstance: any = {
      departureDate: "",
      returnDate: "",
      pricePerPerson: this.offer?.price ?? 0,
      capacity: 10,
      extraBaggageCapacity: 0,
      extraLegroomCapacity: 0,
    };

    // Initialize flight data if needed
    if (this.needsFlightFields) {
      newInstance.flight = {
        outbound: {
          airline: "",
          flightNumber: "",
          from: this.offer?.departureAirport || "",
          to: this.offer?.arrivalAirport || "",
          departureTime: "",
          arrivalTime: "",
          durationMinutes: 0,
        },
        return: {
          airline: "",
          flightNumber: "",
          from: this.offer?.arrivalAirport || "",
          to: this.offer?.departureAirport || "",
          departureTime: "",
          arrivalTime: "",
          durationMinutes: 0,
        },
        aircraft: "",
      };
    }

    this.instances.push(newInstance);
  }

  removeInstance(index: number): void {
    this.instances.splice(index, 1);
  }

  private toOfferPayload(offer: Offer): Partial<Offer> {
    const {
      id,
      departureAirport,
      arrivalAirport,
      extrasConfig,
      isInactive,
      notShowable,
      viewCount,
      favoriteCount,
      createdBy,
      createdAt,
      updatedAt,
      instances,
      ...dto
    } = offer as any;
    return dto;
  }

  async save(): Promise<void> {
    this.saving = true;
    try {
      let offerId: string;
      const payload = this.toOfferPayload(this.offer);

      if (this.isEditMode && this.offer.id) {
        await firstValueFrom(
          this.offerService.updateOffer(this.offer.id, payload as Offer),
        );
        offerId = this.offer.id;
      } else {
        offerId = await firstValueFrom(
          this.offerService.createOfferGetId(payload as Offer),
        );
      }

      // Save any newly added instances
      for (const inst of this.instances) {
        await firstValueFrom(
          this.offerInstanceService.createInstance({
            offerId,
            departureDate: inst.departureDate,
            returnDate: inst.returnDate,
            pricePerPerson: inst.pricePerPerson,
            capacity: inst.capacity,
            extrasCapacity: {
              extraBaggage: inst.extraBaggageCapacity || 0,
              extraLegroom: inst.extraLegroomCapacity || 0,
            },
            extrasAvailable: {
              extraBaggage: (inst.extraBaggageCapacity || 0) > 0,
              extraLegroom: (inst.extraLegroomCapacity || 0) > 0,
            },
            flightDetails: inst.flight,
          }),
        );
      }

      alert(this.isEditMode ? "Ajánlat frissítve" : "Ajánlat létrehozva");
      this.router.navigate(["/offers/update"]);
    } catch (err) {
      console.error("Mentési hiba:", err);
      alert("Hiba történt a mentés során. Lásd a konzolt.");
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  onImagesChange(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.offer.images = value
      .split("\n")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    this.imagePreviewUrls = [...this.offer.images];
  }

  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    this.imageUploadLoading = true;
    this.imageUploadError = null;
    this.cdr.markForCheck();

    const uploads = Array.from(files).map((file) =>
      firstValueFrom(this.imageUploadService.uploadImage(file, "offers")),
    );

    Promise.all(uploads)
      .then((urls) => {
        this.offer.images = [...(this.offer.images || []), ...urls];
        this.imagePreviewUrls = [...this.offer.images];
      })
      .catch((err) => {
        console.error("Image upload error:", err);
        this.imageUploadError =
          "Feltöltési hiba: " + (err?.message ?? "ismeretlen hiba");
      })
      .finally(() => {
        this.imageUploadLoading = false;
        this.cdr.markForCheck();
      });
  }

  removeImage(index: number): void {
    this.offer.images = this.offer.images.filter((_, i) => i !== index);
    this.imagePreviewUrls = [...this.offer.images];
    this.cdr.markForCheck();
  }

  private createEmptyOffer(): Offer {
    return {
      id: "",
      title: "",
      location: "",
      country: "",
      continent: "",
      travelCategory: "individual",
      days: 0,
      nights: 0,
      persons: 1,
      price: 0,
      currency: "EUR",
      images: [],
      shortDescription: "",
      description: "",
      travelPeriodStart: "",
      travelPeriodEnd: "",
      hotelName: "",
      hotelStars: 0,
      hotelAddress: "",
      hotelPhone: "",
      hotelEmail: "",
      departureAirport: "",
      arrivalAirport: "",
      extrasConfig: {
        extraBaggage: 0,
        extraLegroom: 0,
      },
      isInactive: false,
      notShowable: false,
    };
  }

  // ─── Duration Helper Methods ────────────────────────────────────────────

  getDurationHours(totalMinutes: number): number {
    if (!totalMinutes) return 0;
    return Math.floor(totalMinutes / 60);
  }

  getDurationMinutes(totalMinutes: number): number {
    if (!totalMinutes) return 0;
    return totalMinutes % 60;
  }

  setOutboundDurationHours(instance: any, event: Event): void {
    const hours = parseInt((event.target as HTMLInputElement).value) || 0;
    const currentMinutes = this.getDurationMinutes(
      instance.flight.outbound.durationMinutes,
    );
    instance.flight.outbound.durationMinutes = hours * 60 + currentMinutes;
  }

  setOutboundDurationMinutes(instance: any, event: Event): void {
    const minutes = parseInt((event.target as HTMLInputElement).value) || 0;
    const currentHours = this.getDurationHours(
      instance.flight.outbound.durationMinutes,
    );
    instance.flight.outbound.durationMinutes = currentHours * 60 + minutes;
  }

  setReturnDurationHours(instance: any, event: Event): void {
    if (!instance.flight.return) return;
    const hours = parseInt((event.target as HTMLInputElement).value) || 0;
    const currentMinutes = this.getDurationMinutes(
      instance.flight.return.durationMinutes,
    );
    instance.flight.return.durationMinutes = hours * 60 + currentMinutes;
  }

  setReturnDurationMinutes(instance: any, event: Event): void {
    if (!instance.flight.return) return;
    const minutes = parseInt((event.target as HTMLInputElement).value) || 0;
    const currentHours = this.getDurationHours(
      instance.flight.return.durationMinutes,
    );
    instance.flight.return.durationMinutes = currentHours * 60 + minutes;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByInstance(_: number, inst: any): string {
    return inst.id ?? inst.departureDate ?? String(_);
  }
}
