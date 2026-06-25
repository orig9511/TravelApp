import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccommodationReservationComponent } from './accommodation-reservation.component';

describe('AccommodationReservationComponent', () => {
  let component: AccommodationReservationComponent;
  let fixture: ComponentFixture<AccommodationReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccommodationReservationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccommodationReservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
