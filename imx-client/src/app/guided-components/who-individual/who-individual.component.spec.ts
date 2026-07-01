import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhoIndividualComponent } from './who-individual.component';

describe('WhoIndividualComponent', () => {
    let component: WhoIndividualComponent;
    let fixture: ComponentFixture<WhoIndividualComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WhoIndividualComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WhoIndividualComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
