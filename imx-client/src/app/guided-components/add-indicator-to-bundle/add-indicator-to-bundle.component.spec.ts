import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddIndicatorToBundleComponent } from './add-indicator-to-bundle.component';

describe('AddIndicatorToBundleComponent', () => {
    let component: AddIndicatorToBundleComponent;
    let fixture: ComponentFixture<AddIndicatorToBundleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddIndicatorToBundleComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddIndicatorToBundleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
