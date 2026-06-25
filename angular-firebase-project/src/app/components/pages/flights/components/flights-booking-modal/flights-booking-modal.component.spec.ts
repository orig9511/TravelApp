import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightsBookingModalComponent } from './flights-booking-modal.component';

describe('FlightsBookingModalComponent', () => {
  let component: FlightsBookingModalComponent;
  let fixture: ComponentFixture<FlightsBookingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlightsBookingModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlightsBookingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
