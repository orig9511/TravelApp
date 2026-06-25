import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightsSearchBarComponent } from './flights-search-bar.component';

describe('FlightsSearchBarComponent', () => {
  let component: FlightsSearchBarComponent;
  let fixture: ComponentFixture<FlightsSearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlightsSearchBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlightsSearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
