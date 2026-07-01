import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyPasteDialogComponent } from './copy-paste-dialog.component';

describe('CopyPasteDialogComponent', () => {
    let component: CopyPasteDialogComponent;
    let fixture: ComponentFixture<CopyPasteDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CopyPasteDialogComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CopyPasteDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
