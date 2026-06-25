import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightsFiltersSidebarComponent } from './flights-filters-sidebar.component';

describe('FlightsFiltersSidebarComponent', () => {
  let component: FlightsFiltersSidebarComponent;
  let fixture: ComponentFixture<FlightsFiltersSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlightsFiltersSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlightsFiltersSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
