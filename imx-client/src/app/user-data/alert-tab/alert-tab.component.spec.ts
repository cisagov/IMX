import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertTabComponent } from './alert-tab.component';

describe('AlertHistoryComponent', () => {
    let component: AlertTabComponent;
    let fixture: ComponentFixture<AlertTabComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AlertTabComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AlertTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
