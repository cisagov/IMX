import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ExternalReferencesDialogComponent } from './external-references-dialog.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

describe('ExternalReferencesDialogComponent', () => {
    let component: ExternalReferencesDialogComponent;
    let fixture: ComponentFixture<ExternalReferencesDialogComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MatDialogModule, FormsModule, FontAwesomeModule, ReactiveFormsModule],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: {},
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
            ],
            declarations: [ExternalReferencesDialogComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ExternalReferencesDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
