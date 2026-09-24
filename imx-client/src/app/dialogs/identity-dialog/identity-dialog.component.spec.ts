import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdentityDialogComponent } from './identity-dialog.component';

describe('IdentityDialogComponent', () => {
  let component: IdentityDialogComponent;
  let fixture: ComponentFixture<IdentityDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdentityDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdentityDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
