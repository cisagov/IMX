import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMarkingGroupComponent } from './admin-marking-group.component';

describe('AdminMarkingGroupComponent', () => {
    let component: AdminMarkingGroupComponent;
    let fixture: ComponentFixture<AdminMarkingGroupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminMarkingGroupComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminMarkingGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
