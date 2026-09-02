import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxiiSubmissionsComponent } from './taxii-submissions.component';

describe('TaxiiSubmissionsComponent', () => {
  let component: TaxiiSubmissionsComponent;
  let fixture: ComponentFixture<TaxiiSubmissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxiiSubmissionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaxiiSubmissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
