import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightsLoadingComponent } from './flights-loading.component';

describe('FlightsLoadingComponent', () => {
  let component: FlightsLoadingComponent;
  let fixture: ComponentFixture<FlightsLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlightsLoadingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlightsLoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
