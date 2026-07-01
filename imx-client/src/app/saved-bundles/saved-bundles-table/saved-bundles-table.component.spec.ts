import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedBundlesTableComponent } from './saved-bundles-table.component';

describe('SavedBundlesTableComponent', () => {
    let component: SavedBundlesTableComponent;
    let fixture: ComponentFixture<SavedBundlesTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SavedBundlesTableComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SavedBundlesTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
