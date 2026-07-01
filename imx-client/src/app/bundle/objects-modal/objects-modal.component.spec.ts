import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectsModalComponent } from './objects-modal.component';

describe('ObjectsModalComponent', () => {
    let component: ObjectsModalComponent;
    let fixture: ComponentFixture<ObjectsModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ObjectsModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ObjectsModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
