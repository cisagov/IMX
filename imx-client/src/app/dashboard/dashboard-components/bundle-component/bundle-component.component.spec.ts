import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleComponentComponent } from './bundle-component.component';

describe('BundleComponentComponent', () => {
    let component: BundleComponentComponent;
    let fixture: ComponentFixture<BundleComponentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BundleComponentComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(BundleComponentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
