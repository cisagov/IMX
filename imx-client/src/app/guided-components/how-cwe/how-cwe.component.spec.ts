import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowCweComponent } from './how-cwe.component';

describe('HowCweComponent', () => {
    let component: HowCweComponent;
    let fixture: ComponentFixture<HowCweComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HowCweComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HowCweComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
