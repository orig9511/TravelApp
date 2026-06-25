import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccommodationRegisterComponent } from './accommodation-register.component';

describe('AccommodationRegisterComponent', () => {
  let component: AccommodationRegisterComponent;
  let fixture: ComponentFixture<AccommodationRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccommodationRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccommodationRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
