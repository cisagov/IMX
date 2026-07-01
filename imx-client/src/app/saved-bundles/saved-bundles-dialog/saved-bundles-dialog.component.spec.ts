import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedBundlesDialogComponent } from './saved-bundles-dialog.component';

describe('SavedBundlesDialogComponent', () => {
    let component: SavedBundlesDialogComponent;
    let fixture: ComponentFixture<SavedBundlesDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SavedBundlesDialogComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SavedBundlesDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
