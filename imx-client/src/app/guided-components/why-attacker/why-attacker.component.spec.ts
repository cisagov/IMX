import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhyAttackerComponent } from './why-attacker.component';

describe('WhyAttackerComponent', () => {
    let component: WhyAttackerComponent;
    let fixture: ComponentFixture<WhyAttackerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WhyAttackerComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WhyAttackerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
