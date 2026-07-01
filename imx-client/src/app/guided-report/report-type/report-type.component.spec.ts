import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportTypeComponent } from './report-type.component';

describe('ReportTypeComponent', () => {
    let component: ReportTypeComponent;
    let fixture: ComponentFixture<ReportTypeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ReportTypeComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ReportTypeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
