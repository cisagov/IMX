import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowPatternBuilderComponent } from './how-pattern-builder.component';

describe('HowPatternBuilderComponent', () => {
    let component: HowPatternBuilderComponent;
    let fixture: ComponentFixture<HowPatternBuilderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HowPatternBuilderComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HowPatternBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
