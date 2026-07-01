import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveObjectComponent } from './remove-object.component';

describe('RemoveObjectComponent', () => {
    let component: RemoveObjectComponent;
    let fixture: ComponentFixture<RemoveObjectComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RemoveObjectComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(RemoveObjectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
