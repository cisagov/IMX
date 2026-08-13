import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdentityExtensionDialogComponent } from './identity-extension-dialog.component';

describe('IdentityExtensionDialogComponent', () => {
  let component: IdentityExtensionDialogComponent;
  let fixture: ComponentFixture<IdentityExtensionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdentityExtensionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdentityExtensionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
