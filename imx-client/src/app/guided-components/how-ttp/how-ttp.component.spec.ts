import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowTtpComponent } from './how-ttp.component';

describe('HowTtpComponent', () => {
    let component: HowTtpComponent;
    let fixture: ComponentFixture<HowTtpComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HowTtpComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HowTtpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
