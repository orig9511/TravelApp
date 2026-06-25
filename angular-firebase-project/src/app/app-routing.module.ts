import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { OffersComponent } from "./components/pages/offers/offers.component";
import { FlightsComponent } from "./components/pages/flights/flights.component";
import { PackageComponent } from "./components/pages/package/package.component";
import { OfferDetailComponent } from "./components/pages/offers/offer-detail/offer-detail.component";
import { OfferCreateComponent } from "./components/pages/offers/offer-create/offer-create.component";
import { OfferUpdateComponent } from "./components/pages/offers/offer-update/offer-update.component";
import { RegistrationComponent } from "./components/pages/registration/registration.component";
import { AccommodationRegisterComponent } from "./components/pages/accommodation/accommodation-register/accommodation-register.component";
import { AccommodationDetailsComponent } from "./components/pages/accommodation/accommodation-details/accommodation-details.component";
import { AccommodationReservationComponent } from "./components/pages/accommodation/accommodation-reservation/accommodation-reservation.component";
import { authGuard } from "./guards/auth.guard";
import { guestGuard } from "./guards/guest.guard";
import { adminGuard } from "./guards/admin.guard";
import { advertiserGuard } from "./guards/advertiser.guard";

const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./components/pages/home/home.component").then(
        (c) => c.HomeComponent,
      ),
  },
  { path: "offers", component: OffersComponent },
  {
    path: "accommodation",
    loadComponent: () =>
      import("./components/pages/accommodation/accommodation.component").then(
        (c) => c.AccommodationComponent,
      ),
  },
  {
    path: "accommodation-register",
    component: AccommodationRegisterComponent,
    canActivate: [advertiserGuard],
  },
  {
    path: "accommodation-list",
    redirectTo: "accommodation",
    pathMatch: "full",
  },
  { path: "accommodation/:id", component: AccommodationDetailsComponent },
  {
    path: "accommodation/reservation/:id",
    component: AccommodationReservationComponent,
    canActivate: [authGuard],
  },
  {
    path: "offers/create",
    component: OfferCreateComponent,
    canActivate: [advertiserGuard],
  },
  {
    path: "offers/update",
    component: OfferUpdateComponent,
    canActivate: [advertiserGuard],
  },
  {
    path: "offers/update/:id",
    component: OfferCreateComponent,
    canActivate: [advertiserGuard],
  },
  { path: "offers/:id", component: OfferDetailComponent },
  { path: "flights", component: FlightsComponent },
  { path: "package", component: PackageComponent },
  {
    path: "login",
    loadComponent: () =>
      import("./components/pages/login/login.component").then(
        (c) => c.LoginComponent,
      ),
    canActivate: [guestGuard],
  },
  {
    path: "registration",
    component: RegistrationComponent,
    canActivate: [guestGuard],
  },
  {
    path: "favorites",
    loadComponent: () =>
      import("./components/pages/favorite/favorite.component").then(
        (c) => c.FavoriteComponent,
      ),
  },
  {
    path: "booking/:offerId/:instanceId",
    loadComponent: () =>
      import("./components/pages/offers/booking/booking.component").then(
        (c) => c.BookingComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "my-bookings",
    loadComponent: () =>
      import("./components/pages/my-bookings/my-bookings.component").then(
        (c) => c.MyBookingsComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "manage-orders",
    loadComponent: () =>
      import("./components/pages/manage-orders/manage-orders.component").then(
        (c) => c.ManageOrdersComponent,
      ),
    canActivate: [advertiserGuard],
  },
  {
    path: "advertiser-panel",
    loadComponent: () =>
      import("./components/pages/advertiser-panel/advertiser-panel.component").then(
        (c) => c.AdvertiserPanelComponent,
      ),
    canActivate: [advertiserGuard],
  },
  {
    path: "reporting",
    loadComponent: () =>
      import("./components/pages/reporting/reporting.component").then(
        (c) => c.ReportingComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "profile",
    loadComponent: () =>
      import("./components/pages/profile/profile.component").then(
        (c) => c.ProfileComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "admin/users",
    loadComponent: () =>
      import("./components/pages/user-list/user-list.component").then(
        (c) => c.UserListComponent,
      ),
    canActivate: [adminGuard],
  },
  {
    path: "advertiser/accommodations",
    loadComponent: () =>
      import("./components/pages/accommodation-management/accommodation-management.component").then(
        (c) => c.AccommodationManagementComponent,
      ),
    canActivate: [advertiserGuard],
  },
  {
    path: "auth/callback",
    loadComponent: () =>
      import("./components/pages/auth-callback/auth-callback.component").then(
        (c) => c.AuthCallbackComponent,
      ),
  },
  { path: "**", redirectTo: "" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
