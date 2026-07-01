import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteDialogComponent } from './note-dialog-component.component';

describe('NoteDialogComponent', () => {
    let component: NoteDialogComponent;
    let fixture: ComponentFixture<NoteDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NoteDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(NoteDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
