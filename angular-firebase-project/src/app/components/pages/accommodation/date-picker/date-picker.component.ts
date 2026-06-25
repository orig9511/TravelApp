import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  TemplateRef,
  ViewContainerRef,
  ElementRef,
  Injectable,
} from "@angular/core";
import { Overlay, OverlayModule, OverlayRef } from "@angular/cdk/overlay";
import { TemplatePortal } from "@angular/cdk/portal";
import {
  DateRange,
  MatCalendar,
  MatDatepickerModule,
} from "@angular/material/datepicker";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  NativeDateAdapter,
} from "@angular/material/core";
import { TranslateModule } from "@ngx-translate/core";

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
  // 1 = Hétfővel kezdődik a naptár rácsa
  override getFirstDayOfWeek(): number {
    return 1;
  }
}

@Component({
  selector: "app-date-picker",
  standalone: true,
  imports: [
    CommonModule,
    OverlayModule,
    MatDatepickerModule,
    MatFormFieldModule,
    TranslateModule,
  ],
  templateUrl: "./date-picker.component.html",
  styleUrl: "./date-picker.component.scss",
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: "hu-HU" }, // Ez segít a magyar formátumban
  ],
})
export class DatePickerComponent {
  @ViewChild("calendarOverlayTemplate") calendarTemplate!: TemplateRef<any>;
  @ViewChild("dateTrigger") dateTrigger!: ElementRef;

  @ViewChild("leftCalendar") leftCalendar!: MatCalendar<Date>;
  @ViewChild("rightCalendar") rightCalendar!: MatCalendar<Date>;

  @Output() dateRangeChanged = new EventEmitter<DateRange<Date>>(); // Új esemény

  overlayRef: OverlayRef | null = null;
  selectedRange: DateRange<Date> = new DateRange<Date>(null, null);

  get selectedStart() {
    return this.selectedRange.start;
  }
  get selectedEnd() {
    return this.selectedRange.end;
  }

  viewDate: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  get nextMonth(): Date {
    return new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth() + 1,
      1,
    );
  }

  // Ez a függvény lépteti mindkét naptárat egyszerre
  changeMonth(offset: number) {
    this.viewDate = new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth() + offset,
      1,
    );

    // Kényszerítjük a naptárakat a nézetváltásra
    if (this.leftCalendar) this.leftCalendar.activeDate = this.viewDate;
    if (this.rightCalendar) this.rightCalendar.activeDate = this.nextMonth;
  }

  onDateSelected(date: Date | null): void {
    if (!date) return;

    if (!this.selectedRange.start || this.selectedRange.end) {
      this.selectedRange = new DateRange<Date>(date, null);
    } else {
      if (date < this.selectedRange.start) {
        this.selectedRange = new DateRange<Date>(date, null);
      } else {
        this.selectedRange = new DateRange<Date>(
          this.selectedRange.start,
          date,
        );

        // KÜLDÉS A SZÜLŐNEK:
        this.dateRangeChanged.emit(this.selectedRange);

        setTimeout(() => this.closeCalendar(), 300);
      }
    }
  }

  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
  ) {}

  toggleCalendar() {
    this.overlayRef ? this.closeCalendar() : this.openCalendar();
  }

  openCalendar() {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.dateTrigger.nativeElement)
      .withPositions([
        {
          originX: "start",
          originY: "bottom",
          overlayX: "start",
          overlayY: "top",
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: "cdk-overlay-transparent-backdrop",
    });

    if (document.body.classList.contains("dark-mode")) {
      this.overlayRef.overlayElement.classList.add("dark-mode");
    }

    this.overlayRef.backdropClick().subscribe(() => this.closeCalendar());
    const portal = new TemplatePortal(
      this.calendarTemplate,
      this.viewContainerRef,
    );
    this.overlayRef.attach(portal);
  }

  closeCalendar() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef = null;
    }
  }
}
