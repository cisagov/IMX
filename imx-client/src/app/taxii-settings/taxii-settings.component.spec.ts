import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxiiSettingsComponent } from './taxii-settings.component';

describe('TaxiiSettingsComponent', () => {
    let component: TaxiiSettingsComponent;
    let fixture: ComponentFixture<TaxiiSettingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TaxiiSettingsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TaxiiSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
