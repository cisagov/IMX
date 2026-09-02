import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxiiInfoComponent } from './taxii-info.component';

describe('TaxiiInfoComponent', () => {
  let component: TaxiiInfoComponent;
  let fixture: ComponentFixture<TaxiiInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxiiInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaxiiInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
