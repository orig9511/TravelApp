import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { OfferService } from "../../../../services/offer.service";
import { NotificationService } from "../../../../services/notification.service";
import { AdminService } from "../../../../services/admin.service";
import { Offer } from "../../../../models/offer.model";
import { firstValueFrom, Subject, takeUntil } from "rxjs";

@Component({
  selector: "app-offer-update",
  templateUrl: "./offer-update.component.html",
})
export class OfferUpdateComponent implements OnInit, OnDestroy {
  offers: Offer[] = [];
  loading = true;
  resetting = false;
  seedMessage = "";

  private destroy$ = new Subject<void>();

  constructor(
    private offerService: OfferService,
    private notificationService: NotificationService,
    private adminService: AdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.offerService
      .getMyOffers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (offers) => {
          this.offers = offers;
          this.loading = false;
        },
        error: (err) => {
          console.error("Ajánlatok betöltési hiba:", err);
          this.loading = false;
        },
      });
  }

  trackByOfferId(index: number, offer: Offer): string | undefined {
    return offer.id ?? index.toString();
  }

  editOffer(id?: string): void {
    if (!id) return;
    this.router.navigate(["/offers/update", id]);
  }

  deleteOffer(id?: string): void {
    if (!id) return;

    const confirmed = window.confirm(
      "Biztosan törölni szeretnéd ezt az ajánlatot?",
    );
    if (!confirmed) return;

    this.offerService.deleteOffer(id).subscribe({
      next: () => {
        this.offers = this.offers.filter((o) => o.id !== id);
      },
      error: (err: any) => {
        console.error("Törlési hiba:", err);
      },
    });
  }

  toggleInactive(offer: Offer): void {
    if (!offer.id) return;

    const newValue = !offer.isInactive;
    this.offerService
      .updateVisibility(offer.id, { isInactive: newValue })
      .subscribe({
        next: () => {
          offer.isInactive = newValue;
        },
        error: (err: any) => {
          console.error("Inaktív státusz frissítési hiba:", err);
          alert("Hiba történt a státusz frissítése során.");
        },
      });
  }

  async toggleNotShowable(offer: Offer): Promise<void> {
    if (!offer.id) return;

    const newValue = !offer.notShowable;
    const confirmMsg = newValue
      ? "Biztosan elrejted ezt az ajánlatot? A felhasználók nem fogják látni a listában, és értesítést kapnak róla."
      : "Biztosan láthatóvá teszed ezt az ajánlatot?";

    if (!window.confirm(confirmMsg)) return;

    try {
      await firstValueFrom(
        this.offerService.updateVisibility(offer.id, { notShowable: newValue }),
      );
      offer.notShowable = newValue;

      if (newValue && offer.id) {
        await firstValueFrom(
          this.notificationService.notifyFavoriteOfferUnavailable(
            offer.id,
            offer.title,
          ),
        );
      }
    } catch (err) {
      console.error("Láthatóság frissítési hiba:", err);
      alert("Hiba történt a láthatóság frissítése során.");
    }
  }

  async resetAndSeed(): Promise<void> {
    const confirmed = window.confirm(
      "Ez az összes adatot törli és újra feltölti a Supabase adatbázist a transformed JSON fájlokból. Biztosan folytatod?",
    );
    if (!confirmed) return;

    this.resetting = true;
    this.seedMessage = "";

    try {
      const result = await firstValueFrom(this.adminService.triggerSeed());
      this.seedMessage = `Seed sikeres! ${result.inserted.total} rekord feltöltve.`;
      alert(this.seedMessage);
    } catch (err: any) {
      const msg = err?.error?.message ?? err?.message ?? "Ismeretlen hiba";
      this.seedMessage = `Seed hiba: ${msg}`;
      alert(this.seedMessage);
      console.error("Seed error:", err);
    } finally {
      this.resetting = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
