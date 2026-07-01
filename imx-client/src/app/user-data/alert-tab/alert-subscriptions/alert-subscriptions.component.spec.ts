import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertSubscriptionsComponent } from './alert-subscriptions.component';

describe('AlertSubscriptionsComponent', () => {
    let component: AlertSubscriptionsComponent;
    let fixture: ComponentFixture<AlertSubscriptionsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AlertSubscriptionsComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AlertSubscriptionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
