import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhereLocationComponent } from './where-location.component';

describe('WhereLocationComponent', () => {
    let component: WhereLocationComponent;
    let fixture: ComponentFixture<WhereLocationComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WhereLocationComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WhereLocationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
