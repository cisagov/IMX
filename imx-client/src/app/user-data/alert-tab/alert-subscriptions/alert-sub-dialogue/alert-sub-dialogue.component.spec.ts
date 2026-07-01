import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertSubDialogueComponent } from './alert-sub-dialogue.component';

describe('AlertSubDialogueComponent', () => {
    let component: AlertSubDialogueComponent;
    let fixture: ComponentFixture<AlertSubDialogueComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AlertSubDialogueComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AlertSubDialogueComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
