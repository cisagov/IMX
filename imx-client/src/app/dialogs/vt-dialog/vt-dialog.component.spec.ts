import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VtDialogComponent } from './vt-dialog.component';

describe('VtDialogComponent', () => {
    let component: VtDialogComponent;
    let fixture: ComponentFixture<VtDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VtDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(VtDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
