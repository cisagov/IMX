import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuidedCartModalComponent } from './guided-cart-modal.component';

describe('GuidedCartModalComponent', () => {
    let component: GuidedCartModalComponent;
    let fixture: ComponentFixture<GuidedCartModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GuidedCartModalComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GuidedCartModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
