import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhenSightingComponent } from './when-sighting.component';

describe('WhenSightingComponent', () => {
    let component: WhenSightingComponent;
    let fixture: ComponentFixture<WhenSightingComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WhenSightingComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WhenSightingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
