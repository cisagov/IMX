import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhenEventComponent } from './when-event.component';

describe('WhenEventComponent', () => {
    let component: WhenEventComponent;
    let fixture: ComponentFixture<WhenEventComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WhenEventComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WhenEventComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
