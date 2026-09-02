import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxiiSearchBarComponent } from './taxii-search-bar.component';

describe('TaxiiSearchBarComponent', () => {
  let component: TaxiiSearchBarComponent;
  let fixture: ComponentFixture<TaxiiSearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxiiSearchBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaxiiSearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
