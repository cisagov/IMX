import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectAdditionComponent } from './object-addition.component';

describe('ObjectAdditionComponent', () => {
    let component: ObjectAdditionComponent;
    let fixture: ComponentFixture<ObjectAdditionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ObjectAdditionComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ObjectAdditionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
