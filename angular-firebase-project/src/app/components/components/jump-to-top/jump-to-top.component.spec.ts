import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JumpToTopComponent } from './jump-to-top.component';

describe('JumpToTopComponent', () => {
  let component: JumpToTopComponent;
  let fixture: ComponentFixture<JumpToTopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JumpToTopComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JumpToTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
