import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageDialogComponent } from './message-dialog.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

describe('MessageDialogComponent', () => {
    let component: MessageDialogComponent;
    let fixture: ComponentFixture<MessageDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MessageDialogComponent],
            imports: [FormsModule, FontAwesomeModule, ReactiveFormsModule],
            providers: [NgbActiveModal],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MessageDialogComponent);
        component = fixture.componentInstance;
        component.messageObj = { autoConfirm: true };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
