import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcsDialogComponent } from './acs-dialog.component';

describe('AcsDialogComponent', () => {
    let component: AcsDialogComponent;
    let fixture: ComponentFixture<AcsDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcsDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(AcsDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
