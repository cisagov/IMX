import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowObservableComponent } from './how-observable.component';

describe('HowObservableComponent', () => {
    let component: HowObservableComponent;
    let fixture: ComponentFixture<HowObservableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HowObservableComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HowObservableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
