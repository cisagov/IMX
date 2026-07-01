import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalGuidedCartComponent } from './total-guided-cart.component';

describe('TotalGuidedCartComponent', () => {
    let component: TotalGuidedCartComponent;
    let fixture: ComponentFixture<TotalGuidedCartComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TotalGuidedCartComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TotalGuidedCartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
