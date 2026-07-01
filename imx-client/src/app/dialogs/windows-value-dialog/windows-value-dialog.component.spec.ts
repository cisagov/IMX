import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WindowsValueDialogComponent } from './windows-value-dialog.component';

describe('WindowsValueDialogComponent', () => {
    let component: WindowsValueDialogComponent;
    let fixture: ComponentFixture<WindowsValueDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WindowsValueDialogComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WindowsValueDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
