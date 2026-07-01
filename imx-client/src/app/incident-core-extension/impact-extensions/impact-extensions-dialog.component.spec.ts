import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpactExtensionsDialogComponent } from './impact-extensions-dialog.component';

describe('ChangedObjectDialogComponent', () => {
    let component: ImpactExtensionsDialogComponent;
    let fixture: ComponentFixture<ImpactExtensionsDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ImpactExtensionsDialogComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ImpactExtensionsDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
