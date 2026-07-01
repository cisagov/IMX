import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternBuilderComponent } from './pattern-builder.component';

describe('PatternBuilderComponent', () => {
    let component: PatternBuilderComponent;
    let fixture: ComponentFixture<PatternBuilderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PatternBuilderComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PatternBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
