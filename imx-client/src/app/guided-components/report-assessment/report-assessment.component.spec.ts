import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportAssessmentComponent } from './report-assessment.component';

describe('ReportAssessmentComponent', () => {
    let component: ReportAssessmentComponent;
    let fixture: ComponentFixture<ReportAssessmentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ReportAssessmentComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ReportAssessmentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
