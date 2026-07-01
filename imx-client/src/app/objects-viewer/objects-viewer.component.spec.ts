import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectsViewerComponent } from './objects-viewer.component';

describe('ObjectsViewerComponent', () => {
    let component: ObjectsViewerComponent;
    let fixture: ComponentFixture<ObjectsViewerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ObjectsViewerComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ObjectsViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
