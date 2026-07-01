import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipartDialogComponent } from './multipart-dialog.component';

describe('MultipartDialogComponent', () => {
    let component: MultipartDialogComponent;
    let fixture: ComponentFixture<MultipartDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MultipartDialogComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MultipartDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
