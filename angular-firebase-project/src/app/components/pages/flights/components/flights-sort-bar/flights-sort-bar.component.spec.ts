import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightsSortBarComponent } from './flights-sort-bar.component';

describe('FlightsSortBarComponent', () => {
  let component: FlightsSortBarComponent;
  let fixture: ComponentFixture<FlightsSortBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlightsSortBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlightsSortBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
