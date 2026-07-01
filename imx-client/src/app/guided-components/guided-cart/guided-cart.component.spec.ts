import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuidedCartComponent } from './guided-cart.component';

describe('GuidedCartComponent', () => {
    let component: GuidedCartComponent;
    let fixture: ComponentFixture<GuidedCartComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GuidedCartComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GuidedCartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
