import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxiiSettingsDialogComponent } from './taxii-settings-dialog.component';

describe('TaxiiSettingsDialogComponent', () => {
    let component: TaxiiSettingsDialogComponent;
    let fixture: ComponentFixture<TaxiiSettingsDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TaxiiSettingsDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TaxiiSettingsDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
