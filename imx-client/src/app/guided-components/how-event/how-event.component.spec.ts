import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowEventComponent } from './how-event.component';

describe('HowEventComponent', () => {
    let component: HowEventComponent;
    let fixture: ComponentFixture<HowEventComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HowEventComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HowEventComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
