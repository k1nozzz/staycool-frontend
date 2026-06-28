import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PsychologistRequestsComponent } from './psychologist-requests-component';

describe('PsychologistRequestsComponent', () => {
  let component: PsychologistRequestsComponent;
  let fixture: ComponentFixture<PsychologistRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsychologistRequestsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PsychologistRequestsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

