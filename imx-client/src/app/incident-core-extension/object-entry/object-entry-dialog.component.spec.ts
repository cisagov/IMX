import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectEntryDialogComponent } from './object-entry-dialog.component';

describe('ObjectEntryDialogComponent', () => {
    let component: ObjectEntryDialogComponent;
    let fixture: ComponentFixture<ObjectEntryDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ObjectEntryDialogComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ObjectEntryDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
