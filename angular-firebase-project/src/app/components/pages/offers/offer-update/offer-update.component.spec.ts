import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfferUpdateComponent } from './offer-update.component';

describe('OfferUpdateComponent', () => {
  let component: OfferUpdateComponent;
  let fixture: ComponentFixture<OfferUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OfferUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfferUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
