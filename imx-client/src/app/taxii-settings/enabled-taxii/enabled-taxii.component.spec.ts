import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnabledTaxiiComponent } from './enabled-taxii.component';

describe('EnabledTaxiiComponent', () => {
    let component: EnabledTaxiiComponent;
    let fixture: ComponentFixture<EnabledTaxiiComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EnabledTaxiiComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EnabledTaxiiComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
