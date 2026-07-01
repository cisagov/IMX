import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomTaxiiComponent } from './custom-taxii.component';

describe('CustomTaxiiComponent', () => {
    let component: CustomTaxiiComponent;
    let fixture: ComponentFixture<CustomTaxiiComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CustomTaxiiComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CustomTaxiiComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
