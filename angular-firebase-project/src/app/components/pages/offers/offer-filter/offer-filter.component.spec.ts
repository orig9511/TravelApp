import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfferFilterComponent } from './offer-filter.component';

describe('OfferFilterComponent', () => {
  let component: OfferFilterComponent;
  let fixture: ComponentFixture<OfferFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OfferFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfferFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
