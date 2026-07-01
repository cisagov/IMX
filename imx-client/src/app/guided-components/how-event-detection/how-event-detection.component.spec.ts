import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowEventDetectionComponent } from './how-event-detection.component';

describe('HowEventDetectionComponent', () => {
    let component: HowEventDetectionComponent;
    let fixture: ComponentFixture<HowEventDetectionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HowEventDetectionComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HowEventDetectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
