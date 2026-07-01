import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisabledTaxiiComponent } from './disabled-taxii.component';

describe('DisabledTaxiiComponent', () => {
    let component: DisabledTaxiiComponent;
    let fixture: ComponentFixture<DisabledTaxiiComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DisabledTaxiiComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DisabledTaxiiComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
