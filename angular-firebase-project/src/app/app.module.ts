import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import {
  TranslateHttpLoader,
  provideTranslateHttpLoader,
} from "@ngx-translate/http-loader";
import { AuthInterceptor } from "./core/auth.interceptor";
import { ApiResponseInterceptor } from "./core/api-response.interceptor";
import { NavbarComponent } from "./components/components/navbar/navbar.component";
import { FooterComponent } from "./components/components/footer/footer.component";
import { OffersComponent } from "./components/pages/offers/offers.component";
import { FlightsComponent } from "./components/pages/flights/flights.component";
import { PackageComponent } from "./components/pages/package/package.component";
import { OffersListComponent } from "./components/pages/offers/offers-list/offers-list.component";
import { OfferDetailComponent } from "./components/pages/offers/offer-detail/offer-detail.component";
import { OfferCreateComponent } from "./components/pages/offers/offer-create/offer-create.component";
import { OfferFilterComponent } from "./components/pages/offers/offer-filter/offer-filter.component";
import { FormsModule } from "@angular/forms";
import { ContinentSelectorComponent } from "./components/pages/offers/continent-selector/continent-selector.component";
import { OfferUpdateComponent } from "./components/pages/offers/offer-update/offer-update.component";
import { JumpToTopComponent } from "./components/components/jump-to-top/jump-to-top.component";
import { ThemeService } from "./services/theme.service";
import { ReactiveFormsModule } from "@angular/forms";

import { FlightsSearchBarComponent } from "./components/pages/flights/components/flights-search-bar/flights-search-bar.component";
import { FlightsFiltersSidebarComponent } from "./components/pages/flights/components/flights-filters-sidebar/flights-filters-sidebar.component";
import { FlightsSortBarComponent } from "./components/pages/flights/components/flights-sort-bar/flights-sort-bar.component";
import { FlightsResultsListComponent } from "./components/pages/flights/components/flights-results-list/flights-results-list.component";
import { FlightCardComponent } from "./components/pages/flights/components/flight-card/flight-card.component";
import { FlightsBookingModalComponent } from "./components/pages/flights/components/flights-booking-modal/flights-booking-modal.component";
import { FlightsLoadingComponent } from "./components/pages/flights/components/flights-loading/flights-loading.component";

import { RegistrationComponent } from "./components/pages/registration/registration.component";
import { AccommodationRegisterComponent } from "./components/pages/accommodation/accommodation-register/accommodation-register.component";
import { DatePickerComponent } from "./components/pages/accommodation/date-picker/date-picker.component";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { AccommodationDetailsComponent } from "./components/pages/accommodation/accommodation-details/accommodation-details.component";
import { AccommodationReservationComponent } from "./components/pages/accommodation/accommodation-reservation/accommodation-reservation.component";
import { IsoDatePipe } from "./shared/pipes/iso-date.pipe";
import { SmartPricePipe } from "./shared/pipes/smart-price.pipe";
import { ToastComponent } from "./components/components/toast/toast.component";

@NgModule({
  declarations: [
    AppComponent,
    OffersComponent,
    OfferFilterComponent,
    OffersListComponent,
    OfferDetailComponent,
    OfferCreateComponent,
    NavbarComponent,
    FooterComponent,
    FlightsComponent,
    PackageComponent,
    ContinentSelectorComponent,
    OfferUpdateComponent,
    JumpToTopComponent,
    RegistrationComponent,
    FlightsSearchBarComponent,
    FlightsFiltersSidebarComponent,
    FlightsSortBarComponent,
    FlightsResultsListComponent,
    FlightCardComponent,
    FlightsBookingModalComponent,
    FlightsLoadingComponent,
    AccommodationRegisterComponent,
    AccommodationDetailsComponent,
    AccommodationReservationComponent,
    ToastComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DatePickerComponent,
    IsoDatePipe,
    SmartPricePipe,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useClass: TranslateHttpLoader,
      },
    }),
  ],
  providers: [
    ThemeService,
    ...provideTranslateHttpLoader({ prefix: "./i18n/", suffix: ".json" }),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiResponseInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
