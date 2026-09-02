import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxiiSearchComponent } from './taxii-search.component';

describe('TaxiiSearchComponent', () => {
  let component: TaxiiSearchComponent;
  let fixture: ComponentFixture<TaxiiSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxiiSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaxiiSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
