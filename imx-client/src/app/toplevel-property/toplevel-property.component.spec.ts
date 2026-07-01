import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToplevelPropertyComponent } from './toplevel-property.component';

describe('ToplevelPropertyComponent', () => {
    let component: ToplevelPropertyComponent;
    let fixture: ComponentFixture<ToplevelPropertyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ToplevelPropertyComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ToplevelPropertyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
