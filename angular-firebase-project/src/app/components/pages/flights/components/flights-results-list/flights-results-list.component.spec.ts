import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightsResultsListComponent } from './flights-results-list.component';

describe('FlightsResultsListComponent', () => {
  let component: FlightsResultsListComponent;
  let fixture: ComponentFixture<FlightsResultsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlightsResultsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlightsResultsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
