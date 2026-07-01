import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpDialogComponent } from './help-dialog.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

describe('HelpDialogComponent', () => {
    let component: HelpDialogComponent;
    let fixture: ComponentFixture<HelpDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HelpDialogComponent],
            imports: [FormsModule, FontAwesomeModule, ReactiveFormsModule],
            providers: [NgbActiveModal],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HelpDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
