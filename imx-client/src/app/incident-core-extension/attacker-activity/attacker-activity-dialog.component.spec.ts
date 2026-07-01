import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttackerActivityDialogComponent } from './attacker-activity-dialog.component';

describe('AttackerActivityDialogComponent', () => {
    let component: AttackerActivityDialogComponent;
    let fixture: ComponentFixture<AttackerActivityDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AttackerActivityDialogComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AttackerActivityDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
