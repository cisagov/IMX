import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxiiQueryComponent } from './taxii-query.component';

describe('TaxiiQueryComponent', () => {
  let component: TaxiiQueryComponent;
  let fixture: ComponentFixture<TaxiiQueryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxiiQueryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaxiiQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
