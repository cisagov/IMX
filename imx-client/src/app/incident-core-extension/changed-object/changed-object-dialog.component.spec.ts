import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangedObjectDialogComponent } from './changed-object-dialog.component';

describe('ChangedObjectDialogComponent', () => {
    let component: ChangedObjectDialogComponent;
    let fixture: ComponentFixture<ChangedObjectDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChangedObjectDialogComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChangedObjectDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
